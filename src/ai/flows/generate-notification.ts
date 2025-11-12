
'use server';
/**
 * @fileOverview A flow for generating and storing notifications in Firestore.
 */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const NotificationInputSchema = z.object({
  userId: z.string().describe("The UID of the user who should receive the notification."),
  submissionId: z.string(),
  eventType: z.enum(['STATUS_CHANGED', 'REVIEW_SUBMITTED', 'NEW_SUBMISSION', 'REVIEWER_ASSIGNED']),
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
        default:
            return {
                message: 'You have a new update.',
                icon: 'Bell',
            };
    }
}

export async function generateNotification(input: NotificationInput): Promise<void> {
  const { message, icon } = generateNotificationDetails(input);
  
  const notificationData = {
      userId: input.userId,
      message,
      icon,
      link: `/dashboard/submissions/${input.submissionId}`,
      timestamp: serverTimestamp(),
      read: false,
  };

  const notificationsCollectionRef = collection(db, 'notifications');
  
  addDoc(notificationsCollectionRef, notificationData)
    .catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: notificationsCollectionRef.path,
            operation: 'create',
            requestResourceData: notificationData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}
