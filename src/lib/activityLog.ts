import { firestoreAdminCreate, firestoreAdminList } from './firestoreAdmin';
import { sendNotification } from './notifications';

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
    const timestamp = new Date().toISOString();
    await firestoreAdminCreate('activityLog', {
      ...input,
      createdAt: timestamp,
    });

    // Automatically dispatch a system notification to all admins for audit tracking
    const allUsers = (await firestoreAdminList('users')) as { id: string; role?: string }[];
    const adminIds = allUsers.filter(u => u.role === 'admin').map(u => u.id);
    
    if (adminIds.length > 0) {
      await sendNotification(adminIds, {
        title: 'System Activity',
        message: input.message,
        type: 'system',
        link: '/dashboard/admin', // Default link for admin audit activities
      });
    }

  } catch (error) {
    console.warn('[activity] log write failed (non-critical):', error);
  }
}
