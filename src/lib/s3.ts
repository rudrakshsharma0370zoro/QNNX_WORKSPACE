import { AwsClient } from 'aws4fetch';

/**
 * ============================================================================
 * AWS S3 Storage Subsystem (Edge-compatible, aws4fetch)
 * ============================================================================
 *
 * Uses the lightweight, zero-dependency `aws4fetch` package to produce SigV4
 * presigned PUT URLs directly on the Edge runtime, keeping the bundle small
 * compared to the modular AWS SDK v3.
 *
 * Required server-only env vars:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION            (default: us-east-1)
 *   AWS_S3_BUCKET_NAME
 */

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

let awsClient: AwsClient | null = null;

/** Lazily build the signer so a missing key fails loudly, not with a bad signature. */
function getAwsClient(): AwsClient {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      'Configuration Error: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set.'
    );
  }
  if (!awsClient) {
    awsClient = new AwsClient({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      service: 's3',
      region: AWS_REGION,
    });
  }
  return awsClient;
}

/**
 * Generates a presigned PUT URL for direct browser-to-S3 uploads.
 *
 * The expiry is carried in the `X-Amz-Expires` query parameter, which is part
 * of the SigV4 signature — so we set it *before* signing and sign exactly once.
 * `Content-Type` is a signed header, so the client's PUT must send the same
 * `Content-Type`.
 *
 * @param key - Destination object key in the bucket (e.g. 'uploads/uid/file.pdf')
 * @param contentType - MIME type the client will upload with
 * @param expiresIn - URL lifetime in seconds (default: 900 / 15 min)
 * @returns The fully-signed presigned URL string
 */
export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 900
): Promise<string> {
  if (!AWS_S3_BUCKET_NAME) {
    throw new Error(
      'Configuration Error: AWS_S3_BUCKET_NAME environment variable is not defined.'
    );
  }

  // Virtual-hosted-style endpoint: https://<bucket>.s3.<region>.amazonaws.com/<key>
  const endpoint = new URL(
    `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`
  );
  endpoint.searchParams.set('X-Amz-Expires', String(expiresIn));

  try {
    const signed = await getAwsClient().sign(endpoint.toString(), {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      aws: { signQuery: true },
    });
    return signed.url;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[S3 Subsystem] Error signing request with aws4fetch:', message);
    throw new Error(`S3 Presign Failure: ${message}`);
  }
}

/**
 * Generates a presigned GET URL for downloading a private object.
 * Kept short-lived since it is minted on demand for immediate viewing.
 *
 * @param key - The object key to download
 * @param expiresIn - URL lifetime in seconds (default: 300 / 5 min)
 * @returns The fully-signed presigned GET URL string
 */
export async function getDownloadPresignedUrl(
  key: string,
  expiresIn = 300
): Promise<string> {
  if (!AWS_S3_BUCKET_NAME) {
    throw new Error(
      'Configuration Error: AWS_S3_BUCKET_NAME environment variable is not defined.'
    );
  }

  const endpoint = new URL(
    `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`
  );
  endpoint.searchParams.set('X-Amz-Expires', String(expiresIn));

  try {
    const signed = await getAwsClient().sign(endpoint.toString(), {
      method: 'GET',
      aws: { signQuery: true },
    });
    return signed.url;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[S3 Subsystem] Error signing download request:', message);
    throw new Error(`S3 Presign Failure: ${message}`);
  }
}
