import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminDelete } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

function asyncId(context: any): Promise<string> {
  return Promise.resolve(context.params).then(p => Array.isArray(p.provider) ? p.provider[0] : p.provider);
}

export const DELETE = requireRole(['admin'], async (req, context) => {
  try {
    const provider = await asyncId(context);
    await firestoreAdminDelete('integrations', provider);
    return NextResponse.json({ success: true, message: `${provider} disconnected.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
