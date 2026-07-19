import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin', 'lead'], async (req) => {
  try {
    const integrations = await firestoreAdminList('integrations');
    return NextResponse.json({ success: true, integrations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});