import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminCreate } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const POST = requireRole(['admin', 'lead', 'user'], async (req, context) => {
  try {
    const body = await req.json();
    if (!body.type || !body.details) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const request = {
      type: body.type,
      details: body.details,
      status: 'pending',
      requestedBy: req.user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const id = await firestoreAdminCreate('workflow_requests', request);
    return NextResponse.json({ success: true, id, request });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});