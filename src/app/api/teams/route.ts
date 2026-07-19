import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminCreate } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

/**
 * POST /api/teams
 * 
 * Creates a new team.
 * Admin-only operation.
 * 
 * Body: {
 *   name: string,
 *   leadId: string (optional UID of the team lead)
 * }
 */
export const POST = requireRole(['admin'], async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, leadId, department } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "name" is required and must be a string.' },
        { status: 400 }
      );
    }

    const newTeam = {
      name: name.trim(),
      department: department ? String(department).trim() : null,
      leadId: leadId || null,
      members: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const teamId = await firestoreAdminCreate('teams', newTeam);

    return NextResponse.json({ success: true, teamId, team: newTeam });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Teams] Create error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
});
