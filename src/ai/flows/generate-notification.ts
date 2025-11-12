
'use server';
/**
 * @fileOverview A flow for generating and storing notifications in Firestore.
 */

import { addDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { UserRole }from '@/types';

const NotificationInputSchema = z.object({
  userId: z.string().describe("The UID of the user who should receive the notification, or a role group like 'Admins'."),
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

async function getUidsForRoles(roles: UserRole[]): Promise<string[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', 'in', roles));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.id);
}

async function createNotification(userId: string, submissionId: string, message: string, icon: string) {
    const notificationData = {
        userId: userId,
        message,
        icon,
        link: `/dashboard/submissions/${submissionId}`,
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

export async function generateNotification(input: NotificationInput): Promise<void> {
  const { message, icon } = generateNotificationDetails(input);
  
  if (input.userId === 'Admins') {
      const adminUids = await getUidsForRoles(['Admin', 'Managing Editor']);
      for (const uid of adminUids) {
          await createNotification(uid, input.submissionId, message, icon);
      }
  } else {
    await createNotification(input.userId, input.submissionId, message, icon);
  }
}
