import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminGet, firestoreAdminDelete } from '@/lib/firestoreAdmin';
import { logActivityServer } from '@/lib/activityLog';

// Explicitly define edge execution for Cloudflare compatibility
export const runtime = 'edge';

/**
 * DELETE /api/meetings/[id] — remove a meeting. Restricted to lead / admin.
 */
export const DELETE = requireRole(['lead', 'admin'], async (req, context) => {
  try {
    const params = await context.params;
    const raw = params.id;
    const meetingId = Array.isArray(raw) ? raw[0] : raw;
    if (!meetingId) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Missing meeting id in the route path.' },
        { status: 400 }
      );
    }

    const meeting = await firestoreAdminGet('meetings', meetingId);
    await firestoreAdminDelete('meetings', meetingId);

    const actorName = req.user.name || req.user.email || 'Someone';
    const title = meeting && typeof meeting.title === 'string' ? meeting.title : 'a meeting';
    await logActivityServer({
      type: 'meeting_deleted',
      message: `${actorName} cancelled "${title}"`,
      actorId: req.user.uid,
      actorName,
      meetingId,
    });

    return NextResponse.json({ success: true, id: meetingId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Meeting Delete] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
});
