import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getUploadPresignedUrl } from '@/lib/s3';
import {
  isStorageCategory,
  canUploadToCategory,
  buildStorageKey,
  STORAGE_CATEGORIES,
} from '@/lib/storageCategories';

// Enforce Next.js Edge runtime compatibility for Cloudflare Pages
export const runtime = 'edge';

/**
 * POST /api/uploads/presign
 * Body: { filename, contentType, category }
 *
 * Generates a short-lived S3 presigned PUT URL, routing the object into the
 * correct category "directory" and enforcing who may upload there:
 *   personal-info -> admin only
 *   architecture  -> lead, admin
 *   task-files    -> user, lead, admin
 *
 * Wrapped in `requireRole([])` so any authenticated user reaches the handler;
 * the per-category role check happens below.
 */
export const POST = requireRole([], async (req) => {
  try {
    // 1. Parse and validate the request body.
    const body = await req.json().catch(() => ({}));
    const { filename, contentType, category } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          details: 'Fields "filename" and "contentType" are required in the request payload.',
        },
        { status: 400 }
      );
    }

    if (!isStorageCategory(category)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          details: `Field "category" must be one of: ${STORAGE_CATEGORIES.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    // 2. Enforce the per-category upload policy against the caller's role.
    const role = req.user.role || 'user';
    if (!canUploadToCategory(role, category)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          details: `Role '${role}' is not permitted to upload to '${category}'.`,
        },
        { status: 403 }
      );
    }

    // 3. Build the category-prefixed key: {category}/{uid}/{timestamp}-{name}.
    const s3Key = buildStorageKey(category, req.user.uid, filename);

    // 4. Generate the presigned S3 PUT URL.
    const uploadUrl = await getUploadPresignedUrl(s3Key, contentType);

    // 5. Respond with the upload URL and the permanent s3Key pointer.
    return NextResponse.json({
      success: true,
      uploadUrl,
      s3Key,
      category,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'URL generation failed.';
    console.error('[API Presign Route] Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
});
