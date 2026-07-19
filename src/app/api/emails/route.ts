import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList, firestoreAdminCreate } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin', 'lead'], async (req, context) => {
  try {
    const logs = await firestoreAdminList('email_logs');
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});