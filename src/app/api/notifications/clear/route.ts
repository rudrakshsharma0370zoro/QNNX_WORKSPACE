import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminSet, firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const PATCH = requireRole(['admin', 'lead', 'user'], async (req) => {
  try {
    const uid = req.user.uid;
    const path = `users/${uid}/notifications`;
    
    // Fetch all notifications that aren't already cleared
    const allNotifs = await firestoreAdminList(path);
    const unclearedNotifs = allNotifs.filter((n: any) => !n.cleared);

    // Batch update them to cleared: true
    const tasks = unclearedNotifs.map((n: any) => 
      firestoreAdminSet(path, n.id, { cleared: true })
    );
    
    await Promise.allSettled(tasks);
    
    return NextResponse.json({ success: true, message: 'All notifications cleared' });
  } catch (error: any) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
