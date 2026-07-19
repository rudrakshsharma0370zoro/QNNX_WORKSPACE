import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

/**
 * ============================================================================
 * Enterprise Edge-Compatible Firebase JWT Authentication Subsystem
 * ============================================================================
 * 
 * Hosting on Cloudflare Pages requires all Next.js API Routes to execute in 
 * the Edge Runtime (`export const runtime = 'edge'`). Standard Node.js library 
 * integrations (like `firebase-admin`) are incompatible because they rely on 
 * Node-specific primitives (e.g., net, crypto).
 * 
 * This module utilizes the lightweight, W3C Web Cryptography API-compliant 
 * 'jose' library to verify Firebase ID tokens directly on the Edge.
 */

// Firebase ID Tokens are signed by Google's securetoken service account.
// Google publishes the public certificates as JSON Web Keys (JWKs) at this URL.
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com';

// Establish a remote JWK set resolver. 
// 'createRemoteJWKSet' automatically fetches, verifies, and caches public keys.
// It handles Google's key rotation transparently under the hood.
const jwksResolver = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

// Retrieve the Firebase Project ID from the environment.
// For security verification, the token's audience must match this project ID.
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/**
 * Expected JWT Claims Profile from Firebase Auth
 */
export interface FirebaseUserProfile extends JWTPayload {
  uid: string;
  email?: string;
  role?: string; // Custom claim representing RBAC role (e.g. 'admin', 'manager', 'editor', 'user')
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

/**
 * Request extension to pass authenticated user profile to subsequent route logic
 */
export interface AuthenticatedRequest extends NextRequest {
  user: FirebaseUserProfile;
}

/**
 * Route context shape. Next.js 15+ delivers dynamic route params as a Promise,
 * so it is typed as such here. Kept loose (Record) so this wrapper works for
 * both static routes (params resolves to `{}`) and dynamic ones (e.g. `[id]`).
 */
export type RouteContext = { params: Promise<Record<string, string | string[]>> };

/**
 * Signature for downstream API handlers that receive verified requests
 */
export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  context: RouteContext
) => Promise<Response> | Response;

/**
 * Core verification utility. Verifies JWT signature, expiration, issuer, and audience.
 * 
 * @param token - The raw JWT token string extracted from Authorization header
 * @returns The verified claims payload
 */
export async function verifyFirebaseToken(token: string): Promise<FirebaseUserProfile> {
  if (!FIREBASE_PROJECT_ID) {
    throw new Error('Configuration Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not configured in the server environment.');
  }

  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
  const expectedAudience = FIREBASE_PROJECT_ID;

  try {
    const { payload } = await jwtVerify(token, jwksResolver, {
      issuer: expectedIssuer,
      audience: expectedAudience,
      algorithms: ['RS256'],
    });

    // Firebase UID is always represented by the 'sub' (subject) claim
    if (!payload.sub) {
      throw new Error('Token claims mismatch: Subject (sub) claim is missing.');
    }

    return {
      ...payload,
      uid: payload.sub,
    } as FirebaseUserProfile;
  } catch (error: any) {
    console.error('[Edge Auth] JWT Verification error:', error.message || error);
    throw new Error(error.message || 'Token verification failed.');
  }
}

/**
 * Security Middleware Wrapper (Higher-Order Function)
 * 
 * Checks the Authorization header for a Bearer JWT, validates it on the Edge, 
 * inspects the role claims, and enforces Role-Based Access Control (RBAC).
 * 
 * @param allowedRoles - Array of roles permitted (e.g., ['admin', 'manager']). Pass an empty array `[]` to allow ANY authenticated user.
 * @param handler - The route handler to run if the client is authorized
 * 
 * @example
 * // How to protect an API route (e.g., src/app/api/tasks/route.ts):
 * //
 * // import { requireRole } from '@/lib/auth';
 * // import { NextResponse } from 'next/server';
 * //
 * // export const runtime = 'edge'; // MUST run on Edge Runtime
 * //
 * // export const POST = requireRole(['admin', 'editor'], async (req) => {
 * //   // 1. Access user context injected by middleware
 * //   const { uid, role, email } = req.user;
 * //
 * //   // 2. Perform business logic safely
 * //   return NextResponse.json({ message: 'Success', userId: uid });
 * // });
 */
export function requireRole(allowedRoles: string[], handler: AuthenticatedHandler) {
  return async (req: NextRequest, context: RouteContext) => {
    try {
      // 1. Extract Authorization Header
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json(
          { error: 'Unauthorized', details: 'Missing Authorization header.' },
          { status: 401 }
        );
      }

      const [scheme, token] = authHeader.split(' ');
      if (scheme !== 'Bearer' || !token) {
        return NextResponse.json(
          { error: 'Unauthorized', details: 'Malformed Authorization header. Format: "Bearer <token>"' },
          { status: 401 }
        );
      }

      // 2. Verify Firebase Token
      const userProfile = await verifyFirebaseToken(token);

      // 3. Evaluate Authorization Roles (RBAC)
      // If role claim is not set, default to 'user' role
      const userRole = userProfile.role || 'user';

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        console.warn(`[Edge Auth Warning] User ${userProfile.uid} (Role: ${userRole}) denied access to route. Required: [${allowedRoles.join(', ')}]`);
        return NextResponse.json(
          { 
            error: 'Forbidden', 
            details: `Insufficient permissions. Required roles: [${allowedRoles.join(', ')}]. Current role: '${userRole}'.` 
          },
          { status: 403 }
        );
      }

      // 4. Inject Verified User Profile and proceed
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = userProfile;

      return await handler(authenticatedReq, context);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Unauthorized', details: error.message || 'Token verification failed.' },
        { status: 401 }
      );
    }
  };
}
