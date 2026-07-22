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

// Previously the presigned PUT had no content-type allow-list and no size
// bound at all — any authorized-to-upload role could push arbitrarily large
// files, or types like text/html / image/svg+xml that render as active
// content if ever served inline (see security review, "unrestricted upload
// content-type/size"). Both are enforced below.
const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/zip',
]);

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

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
    const { filename, contentType, category, size } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          details: 'Fields "filename" and "contentType" are required in the request payload.',
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          details: `Content type '${contentType}' is not permitted for upload.`,
        },
        { status: 400 }
      );
    }

    const declaredSize = Number(size);
    if (!Number.isFinite(declaredSize) || declaredSize <= 0) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "size" (bytes, > 0) is required.' },
        { status: 400 }
      );
    }
    if (declaredSize > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          details: `File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB upload limit.`,
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

    // 4. Generate the presigned S3 PUT URL, locked to the declared size via
    //    a signed Content-Length header so the client can't upload more than
    //    what it told us (and got approved) it would.
    const uploadUrl = await getUploadPresignedUrl(s3Key, contentType, 900, declaredSize);

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
