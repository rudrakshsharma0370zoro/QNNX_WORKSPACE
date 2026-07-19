import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminCreate } from '@/lib/firestoreAdmin';
import { logActivityServer } from '@/lib/activityLog';
import {
  isStorageCategory,
  canUploadToCategory,
  STORAGE_CATEGORIES,
} from '@/lib/storageCategories';

// Explicitly define edge execution for Cloudflare compatibility
export const runtime = 'edge';

/**
 * POST /api/documents
 * Body: { title, category, s3Key? , url? }
 *
 * Records a document's metadata. A document is either an uploaded file (s3Key,
 * from /api/uploads/presign) or an external link (url). The same per-category
 * upload permission that governs the file also governs recording it here.
 */
export const POST = requireRole([], async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, category, s3Key, url } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "title" is required.' },
        { status: 400 }
      );
    }
    if (!isStorageCategory(category)) {
      return NextResponse.json(
        { error: 'Bad Request', details: `Field "category" must be one of: ${STORAGE_CATEGORIES.join(', ')}.` },
        { status: 400 }
      );
    }
    if (!s3Key && !url) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Provide an uploaded file ("s3Key") or a link ("url").' },
        { status: 400 }
      );
    }

    const role = req.user.role || 'user';
    if (!canUploadToCategory(role, category)) {
      return NextResponse.json(
        { error: 'Forbidden', details: `Role '${role}' cannot add documents to '${category}'.` },
        { status: 403 }
      );
    }

    const documentId = await firestoreAdminCreate('documents', {
      title: title.trim(),
      category,
      s3Key: s3Key ? String(s3Key) : null,
      url: url ? String(url) : null,
      addedBy: req.user.uid,
      addedAt: new Date().toISOString(),
    });

    const actorName = req.user.name || req.user.email || 'Someone';
    await logActivityServer({
      type: 'document_added',
      message: `${actorName} added "${title.trim()}" to ${category}`,
      actorId: req.user.uid,
      actorName,
    });

    return NextResponse.json(
      { success: true, documentId, message: 'Document recorded.' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Documents] Create Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
});
