import { SignJWT, importPKCS8 } from 'jose';

/**
 * ============================================================================
 * Google Service-Account OAuth2 Token Provider (Edge-compatible)
 * ============================================================================
 *
 * Shared helper that mints short-lived Google OAuth2 access tokens from the
 * Firebase service-account key, using `jose` (Web Crypto) so it runs on the
 * Edge runtime. Both the Firestore REST writer and the Firebase Auth admin
 * module authenticate through here.
 *
 * Tokens are cached in-module *per scope* until shortly before they expire, so
 * we don't pay a JWT-sign + network round-trip on every request. The imported
 * private key (CryptoKey) is cached too.
 *
 * Required server-only env vars:
 *   FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL
 *   FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY   (PEM PKCS8; keep the literal "\n")
 */

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** OAuth2 scopes used across the backend. */
export const GoogleScopes = {
  /** Firestore read/write via the Firestore REST API. */
  DATASTORE: 'https://www.googleapis.com/auth/datastore',
  /** Firebase Auth admin operations (e.g. setting custom claims). */
  IDENTITY_TOOLKIT: 'https://www.googleapis.com/auth/identitytoolkit',
} as const;

interface CachedToken {
  value: string;
  expiresAt: number; // unix seconds
}

const tokenCache = new Map<string, CachedToken>();
let privateKeyPromise: Promise<CryptoKey> | null = null;

function getPrivateKey(): Promise<CryptoKey> {
  const pem = process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!pem) {
    throw new Error(
      'Configuration Missing: FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY is not set.'
    );
  }
  // Reuse the imported key across requests (import is relatively expensive).
  if (!privateKeyPromise) {
    let cleanPem = pem.replace(/\\n/g, '\n');
    if (cleanPem.startsWith('"') && cleanPem.endsWith('"')) {
      cleanPem = cleanPem.slice(1, -1);
    } else if (cleanPem.startsWith("'") && cleanPem.endsWith("'")) {
      cleanPem = cleanPem.slice(1, -1);
    }
    privateKeyPromise = importPKCS8(cleanPem, 'RS256');
  }
  return privateKeyPromise;
}

/**
 * Returns a valid OAuth2 access token for the given scope, minting a new one
 * only when the cached token is missing or about to expire.
 */
export async function getGoogleAccessToken(scope: string): Promise<string> {
  const email = process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL;
  if (!email) {
    throw new Error(
      'Configuration Missing: FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL is not set.'
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const cached = tokenCache.get(scope);
  // Reuse until 60s before actual expiry to avoid edge-of-expiry failures.
  if (cached && cached.expiresAt - 60 > now) {
    return cached.value;
  }

  const privateKey = await getPrivateKey();

  const assertion = await new SignJWT({ scope })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(email)
    .setAudience(OAUTH_TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.error_description ||
        data.error ||
        'Failed to exchange service-account JWT for an access token.'
    );
  }

  tokenCache.set(scope, {
    value: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600),
  });

  return data.access_token;
}
