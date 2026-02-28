
'use server';
/**
 * @fileOverview A flow for logging submission events to Firestore.
 * Now uses the Firebase Admin SDK to bypass security rules on the server.
 */

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { z } from 'zod';

let loggingDisabledDueToPermission = false;

function isPermissionDeniedError(error: any): boolean {
  return (
    error?.code === 7 ||
    error?.code === 'permission-denied' ||
    (typeof error?.details === 'string' && error.details.toLowerCase().includes('missing or insufficient permissions'))
  );
}

const LogEventInputSchema = z.object({
  submissionId: z.string(),
  eventType: z.enum(['SUBMISSION_CREATED', 'STATUS_CHANGED', 'REVIEWER_ASSIGNED', 'REVIEW_SUBMITTED', 'REVIEWER_INVITED']),
  context: z.record(z.string()).optional().describe("Additional context for the event, like the new status or reviewer name."),
});
export type LogEventInput = z.infer<typeof LogEventInputSchema>;


function generateLogDetails(input: LogEventInput): { message: string, icon: string } {
    const { eventType, context = {} } = input;
    const { actorName, status, reviewerName, authorName, reviewerEmail } = context;

    switch (eventType) {
        case 'SUBMISSION_CREATED':
            return {
                message: `Initial submission received from ${authorName || 'the author'}.`,
                icon: 'BookCopy',
            };
        case 'STATUS_CHANGED':
             return {
                message: `Status updated to '${status}'${actorName ? ` by ${actorName}` : ''}.`,
                icon: 'Edit',
            };
        case 'REVIEWER_ASSIGNED':
            return {
                message: `Reviewer assigned: ${reviewerName || 'N/A'}.`,
                icon: 'UserCheck',
            };
        case 'REVIEWER_INVITED':
            return {
                message: `Invited ${reviewerName || 'a new reviewer'} (${reviewerEmail}).`,
                icon: 'Mail',
            };
        case 'REVIEW_SUBMITTED':
             return {
                message: `Review submitted by ${reviewerName || 'a reviewer'}.`,
                icon: 'MessageSquare',
            };
        default:
            return {
                message: 'An unknown event occurred.',
                icon: 'FileEdit',
            };
    }
}


export async function logSubmissionEvent(input: LogEventInput): Promise<void> {
  if (!adminDb) {
      console.warn("[Log Event] Skipped: Admin Firestore is not available.");
      return;
  }

  if (loggingDisabledDueToPermission) {
      return;
  }

  const { message, icon } = generateLogDetails(input);
  
  const historyCollectionRef = adminDb.collection('submissions').doc(input.submissionId).collection('history');
  
  try {
      await historyCollectionRef.add({
          message: message,
          icon: icon,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
  } catch (error: any) {
      if (isPermissionDeniedError(error)) {
          loggingDisabledDueToPermission = true;
          console.warn("[Log Event] Disabled: service account lacks Firestore write permission for submission history.");
          return;
      }
      console.error("[Log Event] Failed to log event via Admin SDK:", error?.message || error);
  }
}
