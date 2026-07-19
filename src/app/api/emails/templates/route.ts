import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin', 'lead'], async (req, context) => {
  try {
    const templates = await firestoreAdminList('email_templates');
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});