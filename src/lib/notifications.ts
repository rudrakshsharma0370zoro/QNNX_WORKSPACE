import { firestoreAdminCreate } from './firestoreAdmin';

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'meeting_scheduled' | 'task_assigned' | 'document_uploaded' | 'system';
  link?: string;
}

/**
 * Sends a notification to one or more users.
 * Uses firestoreAdminCreate under the hood to bypass client rules.
 */
export async function sendNotification(
  userIds: string[],
  payload: NotificationPayload
): Promise<void> {
  const now = new Date().toISOString();
  
  const tasks = userIds.map((userId) => {
    // The collection path will be mapped to a valid Firestore REST path by firestoreAdminCreate.
    // e.g., 'users/123/notifications'
    const collectionPath = `users/${userId}/notifications`;
    return firestoreAdminCreate(collectionPath, {
      ...payload,
      read: false,
      createdAt: now,
    });
  });

  await Promise.allSettled(tasks);
}
