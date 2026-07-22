import { NextRequest, NextResponse } from 'next/server';
import { requireRole, RouteContext } from '@/lib/auth';
import { setUserRole, getAuthUser, isValidRole, VALID_ROLES } from '@/lib/firebaseAuthAdmin';
import { firestoreAdminUpdate, firestoreAdminCreate, firestoreAdminList } from '@/lib/firestoreAdmin';
import { timingSafeEqual } from '@/lib/security';

// Explicitly define edge execution for Cloudflare compatibility
export const runtime = 'edge';

/**
 * Core role-assignment logic. Sets the Firebase custom claim (authoritative for
 * RBAC) and best-effort mirrors it into the users document.
 */
async function assignRole(req: NextRequest, context: RouteContext): Promise<Response> {
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

    const authReq = req as any;
    if (authReq.user && authReq.user.uid === uid) {
      return NextResponse.json(
        { error: 'Forbidden', details: 'You cannot change your own role.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { role } = body;

    if (!isValidRole(role)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          details: `Field "role" must be one of: ${VALID_ROLES.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    // 1. Authoritative: set the Firebase custom claim.
    await setUserRole(uid, role);

    // 2. Mirror the role into the users doc so AuthProvider (which reads the
    //    users document) reflects it. If the doc doesn't exist yet — e.g. the
    //    signup write was blocked by old security rules — create it from the
    //    Auth account so the user shows up in rosters (self-healing).
    try {
      await firestoreAdminUpdate('users', uid, { role, updatedAt: new Date() });
    } catch (mirrorError) {
      const msg = mirrorError instanceof Error ? mirrorError.message : String(mirrorError);
      const docMissing = msg.includes('NOT_FOUND') || msg.includes('No document to update');
      if (!docMissing) {
        console.warn('[API Role] users-doc mirror skipped:', mirrorError);
      } else {
        const info = await getAuthUser(uid);
        await firestoreAdminCreate(
          'users',
          {
            name: info?.displayName || info?.email?.split('@')[0] || 'Unknown User',
            email: info?.email || '',
            role,
            createdAt: new Date(),
            // PII intentionally omitted: sensitive fields live in the private
            // subcollection users/{uid}/private/details, never in this doc,
            // which is readable by any signed-in user.
          },
          uid
        );
      }
    }

    return NextResponse.json({
      success: true,
      uid,
      role,
      note: 'The user must refresh their ID token (getIdToken(true)) for the new role to take effect.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Role] Assign Error:', error);
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json({ error: 'Not Found', details: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
}

// Normal path: only an authenticated 'admin' may change roles.
const adminGuarded = requireRole(['admin'], assignRole);

/**
 * POST /api/users/[id]/role   Body: { role: 'user' | 'lead' | 'admin' }
 *
 * Sets a user's role (Firebase custom claim + users-doc mirror).
 * - Normally requires an authenticated 'admin'.
 * - Bootstrap escape hatch for the first admin (chicken-and-egg): send header
 *   `x-admin-bootstrap-secret` matching env ADMIN_BOOTSTRAP_SECRET.
 *
 * Hardening on top of the original design (see security review — this used to
 * be a standing, reusable backdoor if the env var was ever left set):
 *   1. Constant-time secret comparison (no early-exit timing signal).
 *   2. Self-disabling: the bypass only works while zero admins exist. Once a
 *      single admin account exists in `users`, this path always falls
 *      through to the normal `adminGuarded` flow, so leaving the env var set
 *      after bootstrapping no longer grants standing access to anyone.
 *   3. Every use (successful or attempted) is written to `securityAuditLog`,
 *      best-effort, so an admin can see if/when the bootstrap path fired.
 */
async function anyAdminExists(): Promise<boolean> {
  const users = await firestoreAdminList('users');
  return users.some((u) => u.role === 'admin');
}

async function logBootstrapAttempt(outcome: string, targetUid: string, req: NextRequest) {
  try {
    await firestoreAdminCreate('securityAuditLog', {
      type: 'admin_bootstrap_attempt',
      outcome,
      targetUid,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[API Role] bootstrap audit log write failed (non-critical):', e);
  }
}

export async function POST(
  req: NextRequest,
  context: RouteContext
): Promise<Response> {
  const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  const provided = req.headers.get('x-admin-bootstrap-secret');

  if (bootstrapSecret && provided && timingSafeEqual(provided, bootstrapSecret)) {
    const params = await context.params;
    const rawId = params.id;
    const targetUid = Array.isArray(rawId) ? rawId[0] : rawId ?? 'unknown';

    if (await anyAdminExists()) {
      await logBootstrapAttempt('rejected_admin_already_exists', targetUid, req);
      // Do not reveal that the secret matched — fall through to the normal
      // authenticated-admin path, which will 401/403 for an unauthenticated
      // caller exactly as it would if no secret had been sent at all.
      return adminGuarded(req, context);
    }

    await logBootstrapAttempt('accepted', targetUid, req);
    return assignRole(req, context);
  }

  return adminGuarded(req, context);
}
