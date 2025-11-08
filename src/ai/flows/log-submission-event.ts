
'use server';
/**
 * @fileOverview A flow for logging submission events to Firestore.
 *
 * - logSubmissionEvent - A function that creates a human-readable log entry for an event.
 * - LogEventInput - The input type for the logSubmissionEvent function.
 */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { z } from 'zod';

const LogEventInputSchema = z.object({
  submissionId: z.string(),
  eventType: z.enum(['SUBMISSION_CREATED', 'STATUS_CHANGED', 'REVIEWER_ASSIGNED', 'REVIEW_SUBMITTED']),
  context: z.record(z.string()).optional().describe("Additional context for the event, like the new status or reviewer name."),
});
export type LogEventInput = z.infer<typeof LogEventInputSchema>;


function generateLogDetails(input: LogEventInput): { message: string, icon: string } {
    const { eventType, context = {} } = input;
    const { actorName, status, reviewerName, authorName } = context;

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
  const { message, icon } = generateLogDetails(input);
  
  const historyCollectionRef = collection(db, 'submissions', input.submissionId, 'history');
  
  const historyData = {
      message: message,
      icon: icon,
      timestamp: serverTimestamp(),
  };

  addDoc(historyCollectionRef, historyData)
    .catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: historyCollectionRef.path,
            operation: 'create',
            requestResourceData: historyData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}

    