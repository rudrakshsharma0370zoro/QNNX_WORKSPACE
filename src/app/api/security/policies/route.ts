import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminGet, firestoreAdminUpdate, firestoreAdminCreate } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin', 'lead'], async (req) => {
  try {
    let policies = await firestoreAdminGet('security_policies', 'global');
    if (!policies) {
      policies = {
        mfaRequired: false,
        passwordExpiryDays: 90,
        sessionTimeoutMins: 60
      };
      await firestoreAdminCreate('security_policies', policies, 'global');
    }
    return NextResponse.json({ success: true, policies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const PATCH = requireRole(['admin'], async (req) => {
  try {
    const body = await req.json();
    await firestoreAdminUpdate('security_policies', 'global', body);
    return NextResponse.json({ success: true, message: 'Policies updated.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});