import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminCreate, firestoreAdminGet } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const POST = requireRole(['admin', 'lead'], async (req, context) => {
  try {
    const body = await req.json();
    if (!body.to || !body.subject || !body.body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // In a real application, you would integrate with SendGrid, AWS SES, or Firebase Extensions here.
    // We will log the email attempt to Firestore.
    const emailLog = {
      to: body.to,
      subject: body.subject,
      body: body.body,
      status: 'sent', // mocked
      sentAt: new Date().toISOString(),
      sentBy: req.user.uid,
    };
    
    const id = await firestoreAdminCreate('email_logs', emailLog);
    return NextResponse.json({ success: true, message: 'Email queued for sending.', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});