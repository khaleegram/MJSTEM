
'use server';
/**
 * @fileOverview An AI flow for generating human-readable log messages for submission events.
 *
 * - logSubmissionEvent - A function that creates a descriptive log message for an event.
 * - LogEventInput - The input type for the logSubmissionEvent function.
 * - LogEventOutput - The return type for the logSubmissionEvent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const LogEventInputSchema = z.object({
  submissionId: z.string(),
  eventType: z.enum(['SUBMISSION_CREATED', 'STATUS_CHANGED', 'REVIEWER_ASSIGNED', 'REVIEW_SUBMITTED']),
  context: z.record(z.string()).optional().describe("Additional context for the event, like the new status or reviewer name."),
});
export type LogEventInput = z.infer<typeof LogEventInputSchema>;

const LogEventOutputSchema = z.object({
  logMessage: z.string().describe("A concise, human-readable log message describing the event."),
  icon: z.enum(['BookCopy', 'Edit', 'UserCheck', 'MessageSquare', 'FileEdit']).describe("An appropriate icon name from lucide-react for the event type."),
});
export type LogEventOutput = z.infer<typeof LogEventOutputSchema>;

export async function logSubmissionEvent(input: LogEventInput): Promise<void> {
  const { logMessage, icon } = await generateLogMessageFlow(input);
  
  const historyCollectionRef = collection(db, 'submissions', input.submissionId, 'history');
  const historyData = {
      message: logMessage,
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

const prompt = ai.definePrompt({
  name: 'generateLogMessagePrompt',
  input: { schema: LogEventInputSchema },
  output: { schema: LogEventOutputSchema },
  prompt: `You are an assistant for an academic journal management system. Your task is to generate a concise, human-readable log message and suggest an icon for a submission event.

Event Type: {{{eventType}}}
Context:
{{#if context.actorName}}
- Actor: {{{context.actorName}}}
{{/if}}
{{#if context.status}}
- New Status: {{{context.status}}}
{{/if}}
{{#if context.reviewerName}}
- Reviewer: {{{context.reviewerName}}}
{{/if}}
{{#if context.authorName}}
- Author: {{{context.authorName}}}
{{/if}}

Based on the event type and context, generate a log message.
- For SUBMISSION_CREATED, the message should be like "Initial submission received from [Author Name]."
- For STATUS_CHANGED, the message should be like "Status updated to '[New Status]' by [Actor Name]." If no actor, just say "Status updated to '[New Status]'."
- For REVIEWER_ASSIGNED, the message should be "Reviewer assigned: [Reviewer Name]."
- For REVIEW_SUBMITTED, the message should be "Review submitted by [Reviewer Name]."

Choose an appropriate icon from the following list: 'BookCopy', 'Edit', 'UserCheck', 'MessageSquare', 'FileEdit'.
- SUBMISSION_CREATED: BookCopy
- STATUS_CHANGED: Edit
- REVIEWER_ASSIGNED: UserCheck
- REVIEW_SUBMITTED: MessageSquare
`,
});

const generateLogMessageFlow = ai.defineFlow(
  {
    name: 'generateLogMessageFlow',
    inputSchema: LogEventInputSchema,
    outputSchema: LogEventOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
