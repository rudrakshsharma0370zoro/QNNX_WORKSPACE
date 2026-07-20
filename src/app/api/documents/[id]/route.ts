import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminGet, firestoreAdminDelete } from '@/lib/firestoreAdmin';
import { logActivityServer } from '@/lib/activityLog';
import { deleteObjectFromS3 } from '@/lib/s3';

// Explicitly define edge execution for Cloudflare compatibility
export const runtime = 'edge';

const CONFIDENTIAL = ['employee-records', 'company-confidential'];
const OWNER_CATEGORIES = ['task-files', 'personal-files'];

/**
 * DELETE /api/documents/[id]
 *
 * Removes a document record.
 * - admin: any document
 * - lead: any except the confidential tier (employee-records, company-confidential)
 * - user: only their own task-files / personal-files
 */
export const DELETE = requireRole(['user', 'lead', 'admin'], async (req, context) => {
  try {
    const params = await context.params;
    const raw = params.id;
    const documentId = Array.isArray(raw) ? raw[0] : raw;
    if (!documentId) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Missing document id in the route path.' },
        { status: 400 }
      );
    }

    const document = await firestoreAdminGet('documents', documentId);
    if (!document) {
      return NextResponse.json(
        { error: 'Not Found', details: `Document '${documentId}' does not exist.` },
        { status: 404 }
      );
    }

    const role = req.user.role || 'user';
    const category = typeof document.category === 'string' ? document.category : '';
    const isOwner = document.addedBy === req.user.uid;

    const canDelete =
      role === 'admin' ||
      (role === 'lead' && !CONFIDENTIAL.includes(category)) ||
      (isOwner && OWNER_CATEGORIES.includes(category));

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden', details: 'You are not permitted to delete this document.' },
        { status: 403 }
      );
    }

    // Remove the actual file from S3 before dropping the metadata record.
    // Best-effort: link-only documents have no s3Key, and a failure here
    // (bucket hiccup, already-gone object) must not block cleanup of the
    // Firestore record — an orphaned S3 object is recoverable, a document
    // the user can no longer delete is not.
    const s3Key = typeof document.s3Key === 'string' ? document.s3Key : null;
    if (s3Key) {
      try {
        await deleteObjectFromS3(s3Key);
      } catch (s3Error) {
        console.error('[API Document Delete] S3 object delete failed:', s3Error);
      }
    }

    await firestoreAdminDelete('documents', documentId);

    const actorName = req.user.name || req.user.email || 'Someone';
    const title = typeof document.title === 'string' ? document.title : 'a document';
    await logActivityServer({
      type: 'document_deleted',
      message: `${actorName} removed "${title}"`,
      actorId: req.user.uid,
      actorName,
    });

    return NextResponse.json({ success: true, id: documentId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Document Delete] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
});
