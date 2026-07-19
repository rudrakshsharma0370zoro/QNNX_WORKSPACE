import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const POST = requireRole(['admin', 'lead'], async (req) => {
  try {
    const body = await req.json();
    const type = body.type || 'all'; // 'projects', 'tasks', 'users'
    
    let exportData: any = {};
    if (type === 'all' || type === 'projects') exportData.projects = await firestoreAdminList('projects');
    if (type === 'all' || type === 'tasks') exportData.tasks = await firestoreAdminList('tasks');
    if (type === 'all' || type === 'users') exportData.users = await firestoreAdminList('users');
    
    // In a real application, you might convert this to CSV using a library or return JSON for the client to download.
    return NextResponse.json({
      success: true,
      message: 'Export generated.',
      data: exportData
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});