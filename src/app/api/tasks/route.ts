import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminCreate } from '@/lib/firestoreAdmin';

// Explicitly define edge execution for Cloudflare compatibility
export const runtime = 'edge';

const VALID_PRIORITIES = ['low', 'medium', 'high'] as const;
type Priority = (typeof VALID_PRIORITIES)[number];

/**
 * POST /api/tasks
 *
 * Creates a new task document in Firestore.
 * - Restricted to roles: 'admin' and 'lead'
 * - Bypasses firestore.rules safely via Edge-compatible service-account REST writes.
 *
 * The written shape matches the frontend `Task` contract so the dashboards can
 * read it back directly:
 *   { title, description, assigneeId, status, priority, dueDate, createdBy,
 *     createdAt, updatedAt }
 */
export const POST = requireRole(['admin', 'lead'], async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    // Normalize frontend payload discrepancies
    if (body.assignedTo !== undefined && body.assigneeId === undefined) {
      body.assigneeId = body.assignedTo;
    }
    if (body.priority !== undefined && typeof body.priority === 'string') {
      body.priority = body.priority.toLowerCase();
    }

    const { title, description, assigneeId, priority, dueDate, s3Key, projectId } = body;

    // --- Validation ---
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "title" is required and cannot be empty.' },
        { status: 400 }
      );
    }

    if (!assigneeId || typeof assigneeId !== 'string' || assigneeId.trim() === '') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "assigneeId" (assignee uid) is required.' },
        { status: 400 }
      );
    }

    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          details: `Field "priority" must be one of: ${VALID_PRIORITIES.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const taskId = await firestoreAdminCreate('tasks', {
      title: title.trim(),
      description: description ? String(description).trim() : '',
      assigneeId: assigneeId.trim(),
      status: 'Pending',
      priority: (priority as Priority) ?? 'medium',
      dueDate: dueDate ? String(dueDate) : null,
      projectId: projectId ? String(projectId).trim() : null,
      // Optional pointer to an uploaded attachment in S3.
      s3Key: s3Key ? String(s3Key).trim() : null,
      createdBy: req.user.uid,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      { success: true, taskId, message: 'Task created successfully.' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Tasks] Create Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
});
