import { NextResponse } from 'next/server';
import { sendPasswordResetEmailAdmin } from '@/lib/firebaseAuthAdmin';

export const runtime = 'edge';

/**
 * Minimal in-memory rate limit for this unauthenticated, by-design-open
 * endpoint — without it, anyone can mass-trigger reset emails against
 * arbitrary addresses (email-bombing/harassment vector; see security
 * review, "no rate limiting on forgot-password").
 *
 * Caveat: Cloudflare Workers/Pages Functions can spin up multiple isolates,
 * so this in-memory map is a best-effort, per-isolate backstop, not a hard
 * global limit. For a real global limit, add a Cloudflare Rate Limiting
 * rule on POST /api/auth/forgot-password in the dashboard (Security ->
 * WAF -> Rate limiting rules) — that enforces the limit at the edge before
 * this code even runs. Keep both: the WAF rule is the real control, this is
 * defense in depth for isolates that stick around.
 */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;
const attempts = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (attempts.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  attempts.set(key, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Bad Request', details: 'Email is required.' }, { status: 400 });
    }

    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `${ip}:${email.toLowerCase()}`;
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Too Many Requests', details: 'Please wait before requesting another reset email.' },
        { status: 429 }
      );
    }

    try {
      await sendPasswordResetEmailAdmin(email);
    } catch (err: any) {
      if (err.message === 'EMAIL_NOT_FOUND') {
        // We shouldn't leak whether an email exists or not to unauthenticated users,
        // so we return success either way.
        return NextResponse.json({ success: true, message: 'If the email exists, a reset link was sent.' });
      }
      throw err;
    }

    return NextResponse.json({ success: true, message: 'Password reset link sent successfully.' });
  } catch (error: any) {
    console.error('[API Forgot Password] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', details: 'Failed to send password reset email.' }, { status: 500 });
  }
}
