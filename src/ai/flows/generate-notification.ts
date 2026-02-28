
'use server';
/**
 * @fileOverview A flow for generating and storing notifications in Firestore.
 * Uses Admin SDK to ensure background tasks are not blocked by security rules.
 */

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { UserRole } from '@/types';
import { sendPushNotification } from './send-push-notification';

let notificationsDisabledDueToPermission = false;

function isPermissionDeniedError(error: any): boolean {
  return (
    error?.code === 7 ||
    error?.code === 'permission-denied' ||
    (typeof error?.details === 'string' && error.details.toLowerCase().includes('missing or insufficient permissions'))
  );
}

const NotificationInputSchema = z.object({
  userId: z.string().describe("The UID of the user who should receive the notification, or a role group like 'Admins'."),
  submissionId: z.string(),
  eventType: z.enum(['STATUS_CHANGED', 'REVIEW_SUBMITTED', 'NEW_SUBMISSION', 'REVIEWER_ASSIGNED', 'REVISION_SUBMITTED']),
  context: z.record(z.string()).optional(),
});
export type NotificationInput = z.infer<typeof NotificationInputSchema>;

function generateNotificationDetails(input: NotificationInput): { message: string, icon: string } {
    const { eventType, context = {} } = input;
    const { status, reviewerName, authorName, submissionTitle } = context;
    const truncatedTitle = submissionTitle && submissionTitle.length > 30 ? `${submissionTitle.substring(0, 30)}...` : submissionTitle;

    switch (eventType) {
        case 'STATUS_CHANGED':
            return {
                message: `The status for '${truncatedTitle}' has been updated to '${status}'.`,
                icon: 'Edit',
            };
        case 'REVIEW_SUBMITTED':
            if (input.userId === 'Admins') {
                 return {
                    message: `${reviewerName} has submitted their review for '${truncatedTitle}'.`,
                    icon: 'MessageSquare',
                };
            }
            return {
                message: `A new review was submitted for your manuscript '${truncatedTitle}'.`,
                icon: 'MessageSquare',
            };
        case 'NEW_SUBMISSION':
            return {
                message: `A new manuscript, '${truncatedTitle}', was submitted by ${authorName}.`,
                icon: 'BookCopy',
            };
        case 'REVIEWER_ASSIGNED':
             return {
                message: `You have been assigned to review the manuscript '${truncatedTitle}'.`,
                icon: 'UserCheck',
            };
        case 'REVISION_SUBMITTED':
            return {
                message: `A revision for '${truncatedTitle}' has been submitted by ${authorName}.`,
                icon: 'Upload',
            };
        default:
            return {
                message: 'You have a new update.',
                icon: 'Bell',
            };
    }
}

async function getUidsForRoles(roles: UserRole[]): Promise<string[]> {
    if (!adminDb) return [];
    const usersRef = adminDb.collection('users');
    const snapshot = await usersRef.where('role', 'in', roles).get();
    return snapshot.docs.map(doc => doc.id);
}

async function createNotification(userId: string, submissionId: string, message: string, icon: string) {
    if (!adminDb) return;
    const notificationData = {
        userId: userId,
        message,
        icon,
        link: `/dashboard/submissions/${submissionId}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
    };
    await adminDb.collection('notifications').add(notificationData);
}

export async function generateNotification(input: NotificationInput): Promise<void> {
  if (!adminDb) return;
  if (notificationsDisabledDueToPermission) return;

  try {
    const { message, icon } = generateNotificationDetails(input);
    let targetUids: string[] = [];

    if (input.userId === 'Admins') {
        const adminUids = await getUidsForRoles(['Admin', 'Managing Editor']);
        targetUids = adminUids;
        for (const uid of adminUids) {
            await createNotification(uid, input.submissionId, message, icon);
        }
    } else {
      targetUids = [input.userId];
      await createNotification(input.userId, input.submissionId, message, icon);
    }

    if (targetUids.length > 0) {
      sendPushNotification({
          userIds: targetUids,
          title: 'MJSTEM Update',
          body: message,
          link: `/dashboard/submissions/${input.submissionId}`,
      }).catch(error => {
          console.error("[Push Notification] Failed:", error);
      });
    }
  } catch (error) {
    // Notifications are best-effort and must never break the calling action.
    if (isPermissionDeniedError(error)) {
      notificationsDisabledDueToPermission = true;
      console.warn('[Notification] Disabled: service account lacks Firestore permission for notifications/users query.');
      return;
    }
    console.error('[Notification] Failed to generate notification:', (error as any)?.message || error);
  }
}
