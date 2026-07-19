import { NextResponse } from 'next/server';
import { requireRole, RouteContext, AuthenticatedRequest } from '@/lib/auth';
import { firestoreAdminUpdate, firestoreAdminSet } from '@/lib/firestoreAdmin';

// Explicitly define edge execution for Cloudflare compatibility
export const runtime = 'edge';

/**
 * PATCH /api/users/[id]
 *
 * Self-service profile updates (Settings page). A user may edit their OWN
 * profile; admins may edit anyone's. Only whitelisted fields are accepted —
 * role changes go exclusively through POST /api/users/[id]/role, and email is
 * tied to the Firebase Auth account, so both are rejected here.
 *
 * STORAGE SPLIT — this is deliberate and security-relevant:
 *   users/{uid}                  public-ish profile (name, email, role).
 *                                Readable by any signed-in user so the app can
 *                                render rosters, assignee names and lead lists.
 *   users/{uid}/private/details  sensitive PII (phone, address, ssn).
 *                                Readable only by the owner and admins.
 *
 * Firestore rules cannot hide individual fields — a document is readable or it
 * is not. Keeping PII in a separate document is what makes the parent profile
 * safe to expose.
 *
 * Body: {
 *   name?: string,
 *   personalDetails?: { phone?: string, address?: string, ssn?: string }
 * }
 */

/** Subcollection path holding a user's private PII document. */
const PRIVATE_DETAILS_DOC = 'details';
const privatePath = (uid: string) => `users/${uid}/private`;

const MAX_FIELD_LENGTH = 500;

/** Returns a trimmed string or throws a descriptive error. */
function asTrimmedString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Field "${field}" must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > MAX_FIELD_LENGTH) {
    throw new Error(`Field "${field}" exceeds ${MAX_FIELD_LENGTH} characters.`);
  }
  return trimmed;
}

async function updateProfile(
  req: AuthenticatedRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const rawId = params.id;
    const uid = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!uid) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Missing user id in the route path.' },
        { status: 400 }
      );
    }

    // Self or admin only.
    const isSelf = req.user.uid === uid;
    const isAdmin = (req.user.role || 'user') === 'admin';
    if (!isSelf && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', details: 'You can only edit your own profile.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Privilege-bearing fields are never editable here.
    if ('role' in body || 'email' in body) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          details:
            'Fields "role" and "email" cannot be changed here. Roles are assigned via /api/users/[id]/role.',
        },
        { status: 400 }
      );
    }

    // Fields written to the public-ish users/{uid} document.
    const updates: Record<string, unknown> = {};
    // Fields written to the private users/{uid}/private/details document.
    let privateDetails: Record<string, string> | null = null;

    if (body.name !== undefined) {
      const name = asTrimmedString(body.name, 'name');
      if (!name) {
        return NextResponse.json(
          { error: 'Bad Request', details: 'Field "name" cannot be empty.' },
          { status: 400 }
        );
      }
      updates.name = name;
    }

    if (body.personalDetails !== undefined) {
      const pd = body.personalDetails;
      if (typeof pd !== 'object' || pd === null || Array.isArray(pd)) {
        return NextResponse.json(
          { error: 'Bad Request', details: 'Field "personalDetails" must be an object.' },
          { status: 400 }
        );
      }
      // Whitelist the sub-fields too; empty strings are allowed (clears a value).
      const details: Record<string, string> = {};
      for (const key of ['phone', 'address', 'ssn'] as const) {
        if (pd[key] !== undefined) {
          details[key] = asTrimmedString(pd[key], `personalDetails.${key}`);
        }
      }
      privateDetails = details;
    }

    if (Object.keys(updates).length === 0 && privateDetails === null) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'No editable fields provided (name, personalDetails).' },
        { status: 400 }
      );
    }

    const updated: string[] = [];

    // PII goes to the private subcollection, never the shared profile doc.
    // Upsert, because the private doc is created lazily on first save.
    if (privateDetails !== null) {
      await firestoreAdminSet(privatePath(uid), PRIVATE_DETAILS_DOC, {
        ...privateDetails,
        updatedAt: new Date(),
      });
      updated.push('personalDetails');
    }

    // The parent profile doc is only touched when a public field changed, so a
    // PII-only save cannot fail on a user whose profile doc is missing.
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await firestoreAdminUpdate('users', uid, updates);
      updated.push(...Object.keys(updates));
    }

    return NextResponse.json({ success: true, uid, updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Users] Profile update error:', error);
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json(
        { error: 'Not Found', details: `No profile document exists for this user.` },
        { status: 404 }
      );
    }
    if (message.startsWith('Field "')) {
      return NextResponse.json({ error: 'Bad Request', details: message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
}

// Any authenticated user may hit this route; per-target authorization happens
// inside the handler (self or admin).
export const PATCH = requireRole([], updateProfile);
