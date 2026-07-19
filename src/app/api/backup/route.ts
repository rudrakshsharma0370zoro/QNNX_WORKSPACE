import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList, firestoreAdminCreate } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin'], async (req) => {
  try {
    const backups = await firestoreAdminList('backup_jobs');
    return NextResponse.json({ success: true, backups });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const POST = requireRole(['admin'], async (req) => {
  try {
    // In a real application, this would trigger a GCP Datastore Export via Cloud Functions or REST API.
    const backupJob = {
      status: 'pending',
      type: 'manual',
      timestamp: new Date().toISOString(),
      url: null,
      createdBy: req.user.uid
    };
    
    const id = await firestoreAdminCreate('backup_jobs', backupJob);
    return NextResponse.json({ success: true, message: 'Backup triggered.', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});