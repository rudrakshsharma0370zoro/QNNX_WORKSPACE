import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminGet, firestoreAdminUpdate, firestoreAdminList } from '@/lib/firestoreAdmin';
import { logActivityServer } from '@/lib/activityLog';
import { sendNotification } from '@/lib/notifications';

export const runtime = 'edge';

/**
 * PATCH /api/meetings/[id]/remove
 * 
 * Soft-deletes a meeting (globally for admins, personally for leads/users).
 */
export const PATCH = requireRole(['admin', 'lead', 'user'], async (req, { params }) => {
  try {
    const resolvedParams = await params;
    const rawId = resolvedParams.id;
    const meetingId = Array.isArray(rawId) ? rawId[0] : rawId;
    const user = req.user;

    const meeting = await firestoreAdminGet('meetings', meetingId);
    if (!meeting) {
      return NextResponse.json({ error: 'Not Found', details: 'Meeting not found.' }, { status: 404 });
    }

    // Role-Based Validation & Deletion
    if (user.role === 'admin') {
      // Admin deletes globally
      await firestoreAdminUpdate('meetings', meetingId, {
        isHidden: true,
        updatedBy: user.uid,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Lead and User delete personally (hide from their own dashboard)
      // We will need to use firestoreAdminCommit for array appending
      const { firestoreAdminCommit } = await import('@/lib/firestoreAdmin');
      await firestoreAdminCommit('meetings', meetingId, {
        appendUnique: { hiddenBy: [user.uid] }
      });
    }

    const actorName = user.name || user.email || 'Someone';
    const meetingTitle = meeting.title || 'Untitled Meeting';

    // Audit Log
    await logActivityServer({
      type: 'meeting_deleted',
      message: `${actorName} removed the meeting: "${meetingTitle}"`,
      actorId: user.uid,
      actorName,
      meetingId,
    });

    // Notify admins and leads
    try {
      const allUsers = await firestoreAdminList('users');
      const notifyUsers = allUsers
        .filter((u: any) => (u.role === 'admin' || u.role === 'lead') && u.id !== user.uid)
        .map((u: any) => u.id);

      if (notifyUsers.length > 0) {
        await sendNotification(notifyUsers, {
          title: 'Meeting Removed',
          message: `${actorName} removed the meeting: "${meetingTitle}".`,
          type: 'system',
        });
      }
    } catch (err) {
      console.error('[API Meetings Remove] Error sending notifications:', err);
    }

    return NextResponse.json({ success: true, message: 'Meeting removed successfully.' });
  } catch (error: any) {
    console.error('[API Meetings Remove] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
});
