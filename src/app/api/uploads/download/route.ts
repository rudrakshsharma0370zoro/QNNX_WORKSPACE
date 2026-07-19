import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDownloadPresignedUrl } from '@/lib/s3';
import { parseStorageKey, canReadCategory } from '@/lib/storageCategories';

// Enforce Next.js Edge runtime compatibility for Cloudflare Pages
export const runtime = 'edge';

/**
 * POST /api/uploads/download
 * Body: { s3Key }
 *
 * Returns a short-lived presigned GET URL for a stored object, enforcing the
 * per-category read policy derived from the key's `{category}/{ownerUid}/...`
 * prefix:
 *   personal-info -> admin only
 *   architecture  -> lead, admin
 *   task-files    -> the owner + lead, admin
 *
 * Wrapped in `requireRole([])` so any authenticated user reaches the handler;
 * the per-category / ownership check happens below.
 */
export const POST = requireRole([], async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { s3Key } = body;

    if (!s3Key || typeof s3Key !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "s3Key" is required.' },
        { status: 400 }
      );
    }

    const parsed = parseStorageKey(s3Key);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Malformed s3Key (expected {category}/{uid}/{file}).' },
        { status: 400 }
      );
    }

    // Enforce read policy: role-based, plus owner access for task-files.
    const role = req.user.role || 'user';
    const isOwner = parsed.ownerUid === req.user.uid;
    if (!canReadCategory(role, parsed.category, { isOwner })) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          details: `Role '${role}' is not permitted to access '${parsed.category}' files.`,
        },
        { status: 403 }
      );
    }

    const downloadUrl = await getDownloadPresignedUrl(s3Key);

    return NextResponse.json({
      success: true,
      downloadUrl,
      category: parsed.category,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'URL generation failed.';
    console.error('[API Download Route] Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
});
