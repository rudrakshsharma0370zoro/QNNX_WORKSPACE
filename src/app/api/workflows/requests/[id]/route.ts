import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminUpdate } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

function asyncId(context: any): Promise<string> {
  return Promise.resolve(context.params).then(p => Array.isArray(p.id) ? p.id[0] : p.id);
}

export const PATCH = requireRole(['admin', 'lead'], async (req, context) => {
  try {
    const id = await asyncId(context);
    const body = await req.json();
    
    if (!body.status || !['approved', 'rejected'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });
    }
    
    await firestoreAdminUpdate('workflow_requests', id, {
      status: body.status,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.uid,
    });
    
    return NextResponse.json({ success: true, message: 'Request updated.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
