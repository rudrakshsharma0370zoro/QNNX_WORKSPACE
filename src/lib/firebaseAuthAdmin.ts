import { getGoogleAccessToken, GoogleScopes } from './googleServiceAuth';

/**
 * ============================================================================
 * Firebase Auth Admin Subsystem (Edge-compatible, Identity Toolkit REST)
 * ============================================================================
 *
 * The Node-only `firebase-admin` SDK can't run on the Edge, so we set Firebase
 * custom claims by calling the Identity Toolkit REST endpoint `accounts:update`
 * directly, authenticated as the service account.
 *
 * Custom claims are how RBAC works here: `src/lib/auth.ts` reads `role` from the
 * verified ID token. Setting the claim here is what actually makes a user a
 * 'lead' or 'admin'.
 *
 * NOTE: `customAttributes` replaces the *entire* custom-claims object for the
 * user. We only use `role`, so writing `{ role }` is correct; if more claims
 * are introduced later, merge them here before writing.
 *
 * The service account needs the "Firebase Authentication Admin" permission.
 */

const IDENTITY_TOOLKIT_BASE = 'https://identitytoolkit.googleapis.com/v1';

export const VALID_ROLES = ['pending', 'user', 'lead', 'admin'] as const;
export type AppRole = (typeof VALID_ROLES)[number];

export function isValidRole(value: unknown): value is AppRole {
  return typeof value === 'string' && (VALID_ROLES as readonly string[]).includes(value);
}

function requireProjectId(): string {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      'Configuration Missing: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set.'
    );
  }
  return projectId;
}

export interface AuthUserInfo {
  uid: string;
  email?: string;
  displayName?: string;
}

/**
 * Looks up a Firebase Auth user by uid via Identity Toolkit `accounts:lookup`.
 * Returns null when no auth user exists for the uid.
 */
export async function getAuthUser(uid: string): Promise<AuthUserInfo | null> {
  const token = await getGoogleAccessToken(GoogleScopes.IDENTITY_TOOLKIT);

  const response = await fetch(
    `${IDENTITY_TOOLKIT_BASE}/projects/${requireProjectId()}/accounts:lookup`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ localId: [uid] }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Identity Toolkit accounts:lookup failed.');
  }

  const user = data.users?.[0];
  if (!user) return null;
  return { uid: user.localId, email: user.email, displayName: user.displayName };
}

/**
 * Sets the `role` custom claim on a Firebase Auth user.
 * Throws `NOT_FOUND: ...` if no auth user exists for the uid.
 *
 * The user must refresh their ID token (`getIdToken(true)` on the client) for
 * the new claim to take effect.
 */
export async function setUserRole(uid: string, role: AppRole): Promise<void> {
  const token = await getGoogleAccessToken(GoogleScopes.IDENTITY_TOOLKIT);

  const response = await fetch(
    `${IDENTITY_TOOLKIT_BASE}/projects/${requireProjectId()}/accounts:update`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        localId: uid,
        customAttributes: JSON.stringify({ role }),
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const apiMessage: string = data?.error?.message || '';
    if (response.status === 404 || apiMessage === 'USER_NOT_FOUND') {
      throw new Error(`NOT_FOUND: No Firebase Auth user found for uid '${uid}'.`);
    }
    throw new Error(apiMessage || 'Failed to set custom claims via Identity Toolkit.');
  }
}
