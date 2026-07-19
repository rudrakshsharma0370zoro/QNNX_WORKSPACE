import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList, firestoreAdminCreate } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin', 'lead', 'user'], async (req, context) => {
  try {
    const events = await firestoreAdminList('calendar_events');
    // In a real app, we would filter events based on the user's role or attendance.
    // For now, we return all events to get the calendar UI working.
    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const POST = requireRole(['admin', 'lead', 'user'], async (req, context) => {
  try {
    const body = await req.json();
    if (!body.title || !body.startTime || !body.endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const newEvent = {
      title: body.title,
      description: body.description || '',
      startTime: body.startTime,
      endTime: body.endTime,
      type: body.type || 'meeting',
      attendees: body.attendees || [],
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    };
    
    const id = await firestoreAdminCreate('calendar_events', newEvent);
    return NextResponse.json({ success: true, id, event: newEvent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});