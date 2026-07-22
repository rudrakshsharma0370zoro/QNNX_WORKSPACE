import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin', 'lead'], async (req) => {
  try {
    const integrations = await firestoreAdminList('integrations');

    // `config` holds provider secrets (API keys/OAuth tokens) written at
    // connect-time. Only admin can connect/disconnect integrations, so leads
    // — who can't manage them anyway — must not receive the raw config, only
    // enough to know an integration is connected (see security review,
    // "integrations secrets visible to lead").
    const role = req.user.role;
    const sanitized = (integrations as any[]).map((i) => {
      if (role === 'admin') return i;
      const { config, ...rest } = i;
      return rest;
    });

    return NextResponse.json({ success: true, integrations: sanitized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});