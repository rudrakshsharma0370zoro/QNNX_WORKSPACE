import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminGet, firestoreAdminUpdate, firestoreAdminDelete } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

function asyncId(context: any): Promise<string> {
  return Promise.resolve(context.params).then(p => Array.isArray(p.id) ? p.id[0] : p.id);
}

/**
 * A plain 'user' may only modify/delete events they created or are an
 * attendee on. Admin/lead may act on any event. Without this check any
 * signed-in user could edit or delete anyone else's calendar event (IDOR —
 * see security review, "calendar IDOR").
 */
async function canModifyEvent(role: string, uid: string, id: string): Promise<boolean> {
  if (role === 'admin' || role === 'lead') return true;
  const event = await firestoreAdminGet('calendar_events', id);
  if (!event) return false;
  const attendees = Array.isArray((event as any).attendees) ? (event as any).attendees : [];
  return (event as any).createdBy === uid || attendees.includes(uid);
}

export const PATCH = requireRole(['admin', 'lead', 'user'], async (req, context) => {
  try {
    const id = await asyncId(context);

    if (!(await canModifyEvent(req.user.role, req.user.uid, id))) {
      return NextResponse.json(
        { error: 'Forbidden', details: 'You can only edit events you created or attend.' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const updates: any = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.startTime !== undefined) updates.startTime = body.startTime;
    if (body.endTime !== undefined) updates.endTime = body.endTime;
    if (body.type !== undefined) updates.type = body.type;

    await firestoreAdminUpdate('calendar_events', id, updates);
    return NextResponse.json({ success: true, message: 'Event updated.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const DELETE = requireRole(['admin', 'lead', 'user'], async (req, context) => {
  try {
    const id = await asyncId(context);

    if (!(await canModifyEvent(req.user.role, req.user.uid, id))) {
      return NextResponse.json(
        { error: 'Forbidden', details: 'You can only delete events you created or attend.' },
        { status: 403 }
      );
    }

    await firestoreAdminDelete('calendar_events', id);
    return NextResponse.json({ success: true, message: 'Event deleted.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
