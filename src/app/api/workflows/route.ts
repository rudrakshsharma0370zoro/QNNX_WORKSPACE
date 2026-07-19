import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin', 'lead', 'user'], async (req, context) => {
  try {
    const workflows = await firestoreAdminList('workflows');
    return NextResponse.json({ success: true, workflows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});