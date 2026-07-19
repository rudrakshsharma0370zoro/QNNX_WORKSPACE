import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminCreate, firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin', 'lead', 'user'], async (req) => {
  try {
    const departments = await firestoreAdminList('departments');
    return NextResponse.json({ success: true, departments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const POST = requireRole(['admin'], async (req) => {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Missing department name' }, { status: 400 });
    }
    
    const dept = {
      name: body.name,
      headUid: body.headUid || null,
      description: body.description || '',
      createdAt: new Date().toISOString()
    };
    
    const id = await firestoreAdminCreate('departments', dept);
    return NextResponse.json({ success: true, id, department: dept });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});