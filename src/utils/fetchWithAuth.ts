import { auth } from '@/config/firebaseConfig';

/**
 * A wrapper around the standard `fetch` API that automatically attaches 
 * the Firebase Authorization Bearer token if a user is logged in.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await auth.currentUser?.getIdToken();

  const headers = new Headers(options.headers || {});
  
  // Ensure we send JSON if body is provided and Content-Type isn't manually set
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach the token
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers
  });
}
