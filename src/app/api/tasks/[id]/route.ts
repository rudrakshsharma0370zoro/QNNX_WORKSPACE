import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import {
  firestoreAdminGet,
  firestoreAdminCommit,
  firestoreAdminDelete,
} from '@/lib/firestoreAdmin';
import { logActivityServer } from '@/lib/activityLog';

// Explicitly define edge execution for Cloudflare compatibility
export const runtime = 'edge';

const VALID_STATUSES = ['Pending', 'In Progress', 'Completed'] as const;
const VALID_PRIORITIES = ['low', 'medium', 'high'] as const;
// Fields only a lead/admin may edit (everyone may change status / add comments).
const PRIVILEGED_FIELDS = ['title', 'description', 'priority', 'dueDate', 'assignees', 'projectId', 'attachments'] as const;

function randomId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function asyncTaskIdFrom(context: { params: Promise<Record<string, string | string[]>> | Record<string, string | string[]> }): Promise<string | undefined> {
  return Promise.resolve(context.params).then(params => {
    const raw = params.id;
    return Array.isArray(raw) ? raw[0] : raw;
  });
}

/**
 * PATCH /api/tasks/[id]   Body: { status?, comment?, title?, description?, priority?, dueDate?, assigneeId? }
 *
 * - lead / admin may edit any field of any task.
 * - a user may only change `status` / add a `comment` on a task assigned to them.
 * Comments are appended atomically (arrayUnion-equivalent) as
 * { id, text, author, timestamp }; author comes from the verified token.
 */
export const PATCH = requireRole(['user', 'lead', 'admin'], async (req, context) => {
  try {
    const taskId = await asyncTaskIdFrom(context as any);
    if (!taskId) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Missing task id in the route path.' },
        { status: 400 }
      );
    }

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
    if (body.status !== undefined && typeof body.status === 'string') {
      const STATUS_MAP: Record<string, string> = {
        'pending': 'Pending',
        'in-progress': 'In Progress',
        'completed': 'Completed'
      };
      body.status = STATUS_MAP[body.status.toLowerCase()] || body.status;
    }

    const task = await firestoreAdminGet('tasks', taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Not Found', details: `Task '${taskId}' does not exist.` },
        { status: 404 }
      );
    }

    const role = req.user.role || 'user';
    const isPrivileged = role === 'lead' || role === 'admin';
    const isAssignee = (Array.isArray(task.assignees) && task.assignees.includes(req.user.uid)) || task.assigneeId === req.user.uid;
    if (!isPrivileged && !isAssignee) {
      return NextResponse.json(
        { error: 'Forbidden', details: 'You can only update tasks assigned to you.' },
        { status: 403 }
      );
    }

    const set: Record<string, unknown> = { updatedAt: new Date() };
    const appendUnique: Record<string, unknown[]> = {};
    let addedComment: Record<string, unknown> | null = null;

    // status — assignee, lead, or admin permitted on this task
    if (body.status !== undefined) {
      if (!isAssignee && !isPrivileged) {
        return NextResponse.json(
          { error: 'Forbidden', details: 'Only the specific assignee or an admin/lead can update the task status.' },
          { status: 403 }
        );
      }
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: 'Bad Request', details: `"status" must be one of: ${VALID_STATUSES.join(', ')}.` },
          { status: 400 }
        );
      }
      set.status = body.status;
    }

    // comment — anyone permitted on this task
    if (body.comment !== undefined) {
      const text =
        typeof body.comment === 'string'
          ? body.comment
          : body.comment && typeof body.comment.text === 'string'
          ? body.comment.text
          : '';
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'Bad Request', details: '"comment" text is required.' },
          { status: 400 }
        );
      }
      addedComment = {
        id: randomId(),
        text: text.trim(),
        author: req.user.name || req.user.email || 'Unknown User',
        timestamp: new Date().toISOString(),
      };
      appendUnique.comments = [addedComment];
    }

    // privileged fields — lead/admin only
    const attemptedPrivileged = PRIVILEGED_FIELDS.filter((f) => body[f] !== undefined);
    if (attemptedPrivileged.length > 0) {
      if (!isPrivileged) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            details: `Only a lead/admin may edit task details (${attemptedPrivileged.join(', ')}).`,
          },
          { status: 403 }
        );
      }
      if (body.title !== undefined) {
        if (typeof body.title !== 'string' || body.title.trim() === '') {
          return NextResponse.json(
            { error: 'Bad Request', details: '"title" cannot be empty.' },
            { status: 400 }
          );
        }
        set.title = body.title.trim();
      }
      if (body.description !== undefined) set.description = String(body.description);
      if (body.priority !== undefined) {
        if (!VALID_PRIORITIES.includes(body.priority)) {
          return NextResponse.json(
            { error: 'Bad Request', details: `"priority" must be one of: ${VALID_PRIORITIES.join(', ')}.` },
            { status: 400 }
          );
        }
        set.priority = body.priority;
      }
      if (body.dueDate !== undefined) set.dueDate = body.dueDate ? String(body.dueDate) : null;
      if (body.assignees !== undefined) {
        if (!Array.isArray(body.assignees)) {
          return NextResponse.json(
            { error: 'Bad Request', details: '"assignees" must be an array.' },
            { status: 400 }
          );
        }
        set.assignees = body.assignees.map(id => String(id).trim());
      }
      if (body.attachments !== undefined) {
        set.attachments = Array.isArray(body.attachments) ? body.attachments.map(a => String(a).trim()) : [];
      }
      if (body.projectId !== undefined) set.projectId = body.projectId ? String(body.projectId).trim() : null;
    }
    
    // VALIDATION: Prevent unassigned tasks from being 'In Progress' or 'Completed'
    const finalAssignees = set.assignees !== undefined ? set.assignees : (task.assignees || []);
    const finalStatus = set.status !== undefined ? set.status : task.status;
    if ((finalStatus === 'In Progress' || finalStatus === 'Completed') && (!Array.isArray(finalAssignees) || finalAssignees.length === 0)) {
       return NextResponse.json(
         { error: 'Bad Request', details: 'An Unassigned task cannot be marked as In Progress or Completed. Please assign it to a user first.' },
         { status: 400 }
       );
    }

    // Require at least one real change (updatedAt alone is not enough).
    const hasFieldChange = Object.keys(set).length > 1;
    if (!hasFieldChange && !addedComment) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Provide at least one field to update or a comment.' },
        { status: 400 }
      );
    }

    await firestoreAdminCommit('tasks', taskId, {
      set,
      appendUnique: Object.keys(appendUnique).length ? appendUnique : undefined,
    });

    // Best-effort activity log.
    const actorName = req.user.name || req.user.email || 'Someone';
    const title = typeof task.title === 'string' ? task.title : 'task';
    if (body.status !== undefined) {
      await logActivityServer({
        type: 'task_status_changed',
        message: `${actorName} marked "${title}" as ${body.status}`,
        actorId: req.user.uid,
        actorName,
        taskId,
      });
    } else if (attemptedPrivileged.length > 0) {
      await logActivityServer({
        type: 'task_updated',
        message: `${actorName} updated "${title}"`,
        actorId: req.user.uid,
        actorName,
        taskId,
      });
    }

    return NextResponse.json({
      success: true,
      id: taskId,
      ...(addedComment ? { comment: addedComment } : {}),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Task Update] Error:', error);
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json({ error: 'Not Found', details: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/tasks/[id] — remove a task. Restricted to lead / admin.
 */
export const DELETE = requireRole(['lead', 'admin'], async (req, context) => {
  try {
    const taskId = await asyncTaskIdFrom(context as any);
    if (!taskId) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Missing task id in the route path.' },
        { status: 400 }
      );
    }

    const task = await firestoreAdminGet('tasks', taskId);
    await firestoreAdminDelete('tasks', taskId);

    const actorName = req.user.name || req.user.email || 'Someone';
    const title = task && typeof task.title === 'string' ? task.title : 'a task';
    await logActivityServer({
      type: 'task_deleted',
      message: `${actorName} deleted "${title}"`,
      actorId: req.user.uid,
      actorName,
      taskId,
    });

    return NextResponse.json({ success: true, id: taskId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Task Delete] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
});
