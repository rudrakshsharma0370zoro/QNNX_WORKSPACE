/**
 * Small shared security helpers used by escape-hatch / bootstrap-style routes
 * (admin bootstrap, dev seeding) that compare a caller-supplied header
 * against a server-side secret.
 */

/**
 * Constant-time string comparison so a secret check doesn't leak timing
 * information about how many leading characters matched. Compares lengths
 * first (safe — length alone doesn't leak content), then walks every
 * character regardless of an early mismatch.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
