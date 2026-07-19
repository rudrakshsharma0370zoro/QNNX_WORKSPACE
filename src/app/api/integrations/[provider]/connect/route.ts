import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminCreate } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

function asyncId(context: any): Promise<string> {
  return Promise.resolve(context.params).then(p => Array.isArray(p.provider) ? p.provider[0] : p.provider);
}

export const POST = requireRole(['admin'], async (req, context) => {
  try {
    const provider = await asyncId(context);
    const body = await req.json();
    
    const integration = {
      isConnected: true,
      connectedAt: new Date().toISOString(),
      connectedBy: req.user.uid,
      config: body.config || {}
    };
    
    await firestoreAdminCreate('integrations', integration, provider);
    return NextResponse.json({ success: true, message: `${provider} connected.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
