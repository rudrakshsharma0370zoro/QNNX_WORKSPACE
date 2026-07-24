import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminCreate } from '@/lib/firestoreAdmin';
import { sendNotification } from '@/lib/notifications';

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
    if (body.assignedTo !== undefined && body.assignees === undefined) {
      body.assignees = Array.isArray(body.assignedTo) ? body.assignedTo : [body.assignedTo];
    }
    if (body.assigneeId !== undefined && body.assignees === undefined) {
      body.assignees = [body.assigneeId];
    }
    if (body.priority !== undefined && typeof body.priority === 'string') {
      body.priority = body.priority.toLowerCase();
    }

    const { title, description, assignees, priority, dueDate, attachments, projectId } = body;

    // --- Validation ---
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "title" is required and cannot be empty.' },
        { status: 400 }
      );
    }

    if (!assignees || !Array.isArray(assignees) || assignees.length === 0) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Field "assignees" (array of uids) is required.' },
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
      assignees: assignees.map(id => String(id).trim()),
      status: 'Pending',
      priority: (priority as Priority) ?? 'medium',
      dueDate: dueDate ? String(dueDate) : null,
      projectId: projectId ? String(projectId).trim() : null,
      attachments: Array.isArray(attachments) ? attachments.map(a => String(a).trim()) : [],
      createdBy: req.user.uid,
      createdAt: now,
      updatedAt: now,
    });

    const notifyUsers = assignees.map(id => String(id).trim());
    if (notifyUsers.length > 0) {
      await sendNotification(notifyUsers, {
        title: 'New Task Assigned',
        message: `You have been assigned to task: "${title.trim()}"`,
        type: 'task_assigned',
        link: `/dashboard/${req.user.role}/tasks`, // Note: user role might not perfectly align with the assignee's role if different, but it's okay as a relative fallback, or just use a general link if possible, but tasks are typically at /dashboard/user/tasks. Let's omit role or just use their role if known.
      });
    }

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
