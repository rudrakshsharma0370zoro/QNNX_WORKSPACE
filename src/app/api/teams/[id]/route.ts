import { NextResponse } from 'next/server';
import { requireRole, RouteContext, AuthenticatedRequest } from '@/lib/auth';
import { firestoreAdminGet, firestoreAdminUpdate, firestoreAdminDelete } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

/**
 * PATCH /api/teams/[id]
 * 
 * Modifies a team. Admins can update any field.
 * Leads can only update the `members` array of their assigned team.
 * 
 * Body: {
 *   name?: string,
 *   leadId?: string | null,
 *   members?: string[] // Full replacement array for the team roster
 * }
 */
export const PATCH = requireRole(['admin', 'lead'], async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const rawId = await context.params;
    const teamId = Array.isArray(rawId.id) ? rawId.id[0] : rawId.id;
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Missing team id.' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const isAdmin = req.user.role === 'admin';

    // Fetch current team to authorize Lead and to diff members for user doc sync
    const currentTeam = await firestoreAdminGet('teams', teamId);
    if (!currentTeam) {
      return NextResponse.json({ error: 'Not Found', details: 'Team not found.' }, { status: 404 });
    }

    // Leads can only edit their own teams
    if (!isAdmin && currentTeam.leadId !== req.user.uid) {
      return NextResponse.json(
        { error: 'Forbidden', details: 'You can only modify your own team.' },
        { status: 403 }
      );
    }

    const updates: Record<string, unknown> = {};

    // Only Admins can change name or lead
    if (isAdmin) {
      if (typeof body.name === 'string' && body.name.trim()) {
        updates.name = body.name.trim();
      }
      if (body.leadId !== undefined) {
        updates.leadId = body.leadId;
      }
    }

    // Admins and Leads can change members
    let oldMembers: string[] = [];
    let newMembers: string[] = [];
    
    if (Array.isArray(body.members)) {
      updates.members = body.members;
      oldMembers = Array.isArray(currentTeam.members) ? (currentTeam.members as string[]) : [];
      newMembers = body.members;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Bad Request', details: 'No valid fields provided.' }, { status: 400 });
    }

    updates.updatedAt = new Date();
    await firestoreAdminUpdate('teams', teamId, updates);

    // Sync teamId to users' documents (best effort)
    if (newMembers.length > 0 || oldMembers.length > 0) {
      const added = newMembers.filter(uid => !oldMembers.includes(uid));
      const removed = oldMembers.filter(uid => !newMembers.includes(uid));

      const syncPromises = [];
      for (const uid of added) {
        syncPromises.push(firestoreAdminUpdate('users', uid, { team: teamId }).catch(e => console.error(`Failed to sync team for user ${uid}`, e)));
      }
      for (const uid of removed) {
        // We only clear the team if they were on this team. We don't have atomic conditional updates here, 
        // so we'll just set it to null assuming they are purely being removed from this team.
        syncPromises.push(firestoreAdminUpdate('users', uid, { team: null }).catch(e => console.error(`Failed to clear team for user ${uid}`, e)));
      }
      await Promise.allSettled(syncPromises);
    }

    return NextResponse.json({ success: true, updated: Object.keys(updates) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Teams] Update error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
  }
});

/**
 * DELETE /api/teams/[id]
 * 
 * Deletes a team. Admin-only operation.
 */
export const DELETE = requireRole(['admin'], async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const rawId = await context.params;
    const teamId = Array.isArray(rawId.id) ? rawId.id[0] : rawId.id;
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Missing team id.' },
        { status: 400 }
      );
    }

    // Optionally fetch members first to clear their team assignment
    const currentTeam = await firestoreAdminGet('teams', teamId);
    
    await firestoreAdminDelete('teams', teamId);

    if (currentTeam && Array.isArray(currentTeam.members)) {
      const syncPromises = currentTeam.members.map((uid: string) => 
        firestoreAdminUpdate('users', uid, { team: null }).catch(e => console.error(`Failed to clear team for user ${uid}`, e))
      );
      await Promise.allSettled(syncPromises);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Teams] Delete error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
  }
});
