import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminGet, firestoreAdminUpdate, firestoreAdminCreate } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin', 'lead', 'user'], async (req) => {
  try {
    let org = await firestoreAdminGet('organization_profile', 'primary');
    if (!org) {
      org = {
        name: 'My Organization',
        domain: 'example.com',
        industry: 'Technology',
        createdAt: new Date().toISOString()
      };
      await firestoreAdminCreate('organization_profile', org, 'primary');
    }
    return NextResponse.json({ success: true, organization: org });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const PATCH = requireRole(['admin'], async (req) => {
  try {
    const body = await req.json();
    await firestoreAdminUpdate('organization_profile', 'primary', body);
    return NextResponse.json({ success: true, message: 'Organization updated.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});