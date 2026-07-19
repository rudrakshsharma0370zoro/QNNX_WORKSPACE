import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminUpdate, firestoreAdminDelete } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

/**
 * PATCH /api/projects/[id]
 */
export const PATCH = requireRole(['lead', 'admin'], async (req, context) => {
  try {
    const params = await context.params;
    const raw = params.id;
    const projectId = Array.isArray(raw) ? raw[0] : raw;
    if (!projectId) {
      return NextResponse.json({ error: 'Bad Request', details: 'Missing project id.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.status !== undefined) updates.status = String(body.status).trim();
    if (body.deadline !== undefined) updates.deadline = body.deadline === null ? null : String(body.deadline).trim();
    if (body.leadId !== undefined) updates.leadId = body.leadId === null ? null : String(body.leadId).trim();
    if (body.employeeIds !== undefined && Array.isArray(body.employeeIds)) updates.employeeIds = body.employeeIds;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Bad Request', details: 'No fields to update.' }, { status: 400 });
    }

    updates.updatedAt = new Date();
    await firestoreAdminUpdate('projects', projectId, updates);

    return NextResponse.json({ success: true, projectId, updated: Object.keys(updates) }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
  }
});

/**
 * DELETE /api/projects/[id]
 */
export const DELETE = requireRole(['admin'], async (req, context) => {
  try {
    const params = await context.params;
    const raw = params.id;
    const projectId = Array.isArray(raw) ? raw[0] : raw;
    if (!projectId) {
      return NextResponse.json({ error: 'Bad Request', details: 'Missing project id.' }, { status: 400 });
    }

    await firestoreAdminDelete('projects', projectId);
    return NextResponse.json({ success: true, id: projectId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
  }
});
