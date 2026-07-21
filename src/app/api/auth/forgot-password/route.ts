import { NextResponse } from 'next/server';
import { sendPasswordResetEmailAdmin } from '@/lib/firebaseAuthAdmin';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Bad Request', details: 'Email is required.' }, { status: 400 });
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
