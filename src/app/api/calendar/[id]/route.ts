import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminUpdate, firestoreAdminDelete } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

function asyncId(context: any): Promise<string> {
  return Promise.resolve(context.params).then(p => Array.isArray(p.id) ? p.id[0] : p.id);
}

export const PATCH = requireRole(['admin', 'lead', 'user'], async (req, context) => {
  try {
    const id = await asyncId(context);
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
    await firestoreAdminDelete('calendar_events', id);
    return NextResponse.json({ success: true, message: 'Event deleted.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
