import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminSet, firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const PATCH = requireRole(['admin', 'lead', 'user'], async (req) => {
  try {
    const { notificationId, all } = await req.json();
    const uid = req.user.uid;

    if (all) {
      // Fetch all unread notifications and mark them as read
      const path = `users/${uid}/notifications`;
      const allNotifs = await firestoreAdminList(path);
      const unreadNotifs = allNotifs.filter((n: any) => !n.read);

      const tasks = unreadNotifs.map((n: any) => 
        firestoreAdminSet(path, n.id, { read: true })
      );
      
      await Promise.allSettled(tasks);
      return NextResponse.json({ success: true, message: 'All marked as read' });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
    }

    // Mark single notification as read
    const path = `users/${uid}/notifications`;
    await firestoreAdminSet(path, notificationId, { read: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking read:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
