import { NextResponse } from 'next/server';
export const runtime = 'edge';
import { requireRole } from '@/lib/auth';
import { firestoreAdminCreate, firestoreAdminUpdate } from '@/lib/firestoreAdmin';
import { logActivityServer } from '@/lib/activityLog';

async function generateGoogleMeetLink(title: string, startTime: string): Promise<string | null> {
  // Google API library relies on Node.js core modules (http/https/net/tls) which are not available in Cloudflare Edge.
  // Returning a free Jitsi alternative instead.
  console.warn('Google Meet link generation is disabled in Edge Runtime. Returning a Jitsi alternative.');
  return `https://meet.jit.si/${Math.random().toString(36).substring(2, 12)}`;
}

const VALID_MEETING_TYPES = ['scheduled', 'instant'] as const;

/**
 * POST /api/meetings
 * Body: { title, description?, date, participants?, link?, type? }
 *
 * Creates a meeting. Restricted to lead / admin.
 * `type` distinguishes an ad-hoc "Start Instant Meeting" from a normally
 * scheduled one, purely for UI display (badge/filtering) — both are stored
 * and read identically otherwise. Defaults to 'scheduled'.
 */
export const POST = requireRole(['lead', 'admin'], async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, description, date, time, platform, participants, link, type } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "title" is required and cannot be empty.' },
        { status: 400 }
      );
    }
    if (!date || typeof date !== 'string' || Number.isNaN(Date.parse(date))) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "date" must be a valid ISO date string.' },
        { status: 400 }
      );
    }
    if (participants !== undefined && !Array.isArray(participants)) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "participants" must be an array of user ids.' },
        { status: 400 }
      );
    }
    if (type !== undefined && !VALID_MEETING_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Bad Request', details: `Field "type" must be one of: ${VALID_MEETING_TYPES.join(', ')}.` },
        { status: 400 }
      );
    }

    let finalLink = link ? String(link).trim() : null;
    
    // If the frontend explicitly left the link blank, or requested a Google Meet link
    if (!finalLink && (!platform || platform.toLowerCase().includes('google'))) {
      const generated = await generateGoogleMeetLink(title.trim(), date);
      if (generated) {
        finalLink = generated;
      }
    }

    const meetingId = await firestoreAdminCreate('meetings', {
      title: title.trim(),
      description: description ? String(description) : '',
      date,
      time: time ? String(time).trim() : null,
      platform: platform ? String(platform).trim() : null,
      participants: Array.isArray(participants) ? participants : [],
      link: finalLink,
      type: type === 'instant' ? 'instant' : 'scheduled',
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    });

    const actorName = req.user.name || req.user.email || 'Someone';
    await logActivityServer({
      type: 'meeting_scheduled',
      message: `${actorName} scheduled "${title.trim()}"`,
      actorId: req.user.uid,
      actorName,
      meetingId,
    });

    return NextResponse.json(
      { success: true, meetingId, link: finalLink, message: 'Meeting created successfully.' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Meetings] Create Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/meetings
 * Body: { meetingId, title?, description?, date?, participants?, link?, s3Key? }
 *
 * Updates an existing meeting (partial). Restricted to lead / admin.
 */
export const PATCH = requireRole(['lead', 'admin'], async (req) => {
  let meetingId: string | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    meetingId = typeof body.meetingId === 'string' ? body.meetingId.trim() : undefined;

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "meetingId" is required and cannot be empty.' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim() === '') {
        return NextResponse.json(
          { error: 'Bad Request', details: 'Field "title" cannot be empty.' },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }
    if (body.description !== undefined) updates.description = String(body.description);
    if (body.date !== undefined) {
      if (typeof body.date !== 'string' || Number.isNaN(Date.parse(body.date))) {
        return NextResponse.json(
          { error: 'Bad Request', details: 'Field "date" must be a valid ISO date string.' },
          { status: 400 }
        );
      }
      updates.date = body.date;
    }
    if (body.participants !== undefined) {
      if (
        !Array.isArray(body.participants) ||
        !body.participants.every((p: unknown) => typeof p === 'string')
      ) {
        return NextResponse.json(
          { error: 'Bad Request', details: 'Field "participants" must be an array of user ids.' },
          { status: 400 }
        );
      }
      updates.participants = body.participants;
    }
    if (body.time !== undefined) {
      updates.time = body.time === null ? null : String(body.time).trim();
    }
    if (body.platform !== undefined) {
      updates.platform = body.platform === null ? null : String(body.platform).trim();
    }
    if (body.link !== undefined) {
      updates.link = body.link === null ? null : String(body.link).trim();
    }
    if (body.s3Key !== undefined) {
      updates.s3Key = body.s3Key === null ? null : String(body.s3Key).trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          details:
            'Provide at least one field to update: title, description, date, participants, link, or s3Key.',
        },
        { status: 400 }
      );
    }

    updates.updatedAt = new Date();
    await firestoreAdminUpdate('meetings', meetingId, updates);

    return NextResponse.json(
      { success: true, meetingId, updated: Object.keys(updates), message: 'Meeting updated successfully.' },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Meetings] Update Error:', error);
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json(
        { error: 'Not Found', details: `Meeting with ID '${meetingId ?? ''}' does not exist.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
});
