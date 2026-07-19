import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminCreate } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

/**
 * POST /api/projects
 * Body: { name, status, deadline, leadId?, employeeIds? }
 */
export const POST = requireRole(['lead', 'admin'], async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, status, deadline, leadId, employeeIds } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "name" is required and cannot be empty.' },
        { status: 400 }
      );
    }
    if (!status || !['In Progress', 'Pending', 'Completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "status" must be In Progress, Pending, or Completed.' },
        { status: 400 }
      );
    }

    const projectId = await firestoreAdminCreate('projects', {
      name: name.trim(),
      status,
      deadline: deadline ? String(deadline).trim() : null,
      leadId: leadId ? String(leadId).trim() : null,
      employeeIds: Array.isArray(employeeIds) ? employeeIds : [],
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, projectId, message: 'Project created successfully.' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Projects] Create Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
});
