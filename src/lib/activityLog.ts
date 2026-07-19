import { firestoreAdminCreate } from './firestoreAdmin';

/**
 * Server-side team activity logger.
 *
 * Writes one entry to the shared `activityLog` feed (read by Lead/Admin
 * dashboards via onSnapshot). Best-effort: activity logging is a non-critical
 * side effect, so a failure here must never fail the primary action.
 *
 * Moving this server-side (from the old client `logActivity`) makes the feed
 * tamper-proof — the actor is taken from the verified token, not the client.
 */
export interface ActivityInput {
  type:
    | 'task_assigned'
    | 'task_updated'
    | 'task_status_changed'
    | 'task_deleted'
    | 'meeting_scheduled'
    | 'meeting_deleted'
    | 'document_added'
    | 'document_deleted';
  message: string;
  actorId: string;
  actorName: string;
  taskId?: string;
  meetingId?: string;
}

export async function logActivityServer(input: ActivityInput): Promise<void> {
  try {
    await firestoreAdminCreate('activityLog', {
      ...input,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[activity] log write failed (non-critical):', error);
  }
}
