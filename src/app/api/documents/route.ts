import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminCreate, firestoreAdminList } from '@/lib/firestoreAdmin';
import { logActivityServer } from '@/lib/activityLog';
import { sendNotification } from '@/lib/notifications';
import {
  isStorageCategory,
  canUploadToCategory,
  canReadCategory,
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

    // Notify admins and leads about the new document
    try {
      const allUsers = await firestoreAdminList('users');
      const notifyUsers = allUsers
        .filter((u: any) => (u.role === 'admin' || u.role === 'lead') || u.id === req.user.uid)
        .map((u: any) => u.id);

      if (notifyUsers.length > 0) {
        await sendNotification(notifyUsers, {
          title: 'New Document Uploaded',
          message: `${actorName} uploaded "${title.trim()}" to ${category}.`,
          type: 'document_uploaded',
          link: `/dashboard/${req.user.role === 'user' ? 'user' : req.user.role}/documents`, 
        });
      }
    } catch (err) {
      console.error('[API Documents] Error sending notifications:', err);
    }

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

export const GET = requireRole([], async (req) => {
  try {
    const { firestoreAdminList } = await import('@/lib/firestoreAdmin');
    const documents = await firestoreAdminList('documents');

    // This route reads with the service account, which bypasses
    // firestore.rules — so the per-category read policy MUST be re-applied
    // here. Without it, any signed-in user would receive employee-records and
    // company-confidential metadata. Mirrors the `documents` rule exactly.
    const role = req.user.role || 'user';
    const visible = (documents as any[]).filter((d) => {
      const category = typeof d?.category === 'string' ? d.category : '';
      if (!isStorageCategory(category)) return false;
      return canReadCategory(role, category, { isOwner: d?.addedBy === req.user.uid });
    });

    // Sort documents by addedAt descending
    visible.sort((a: any, b: any) => {
      const dateA = new Date(a.addedAt || 0).getTime();
      const dateB = new Date(b.addedAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ success: true, documents: visible }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Documents] Get Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
});

