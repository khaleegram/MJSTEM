
'use server';
/**
 * @fileOverview A flow for sending a submission confirmation email.
 */

import { z } from 'zod';
import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import path from 'path';

const SendConfirmationEmailSchema = z.object({
  authorEmail: z.string().email(),
  authorName: z.string(),
  manuscriptTitle: z.string(),
  uniqueId: z.string(),
});
export type SendConfirmationEmailInput = z.infer<typeof SendConfirmationEmailSchema>;

async function getGmailClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }
  });

  const authClient = await auth.getClient();
  google.options({ auth: authClient });

  // Impersonate a user
  const serviceAccountAuth = authClient as any;
  const impersonatedAuth = new google.auth.GoogleAuth({
      auth: serviceAccountAuth,
      clientOptions: {
          subject: process.env.GOOGLE_IMPERSONATED_USER_EMAIL,
      },
  });
  
  return google.gmail({ version: 'v1', auth: impersonatedAuth.auth });
}


export async function sendConfirmationEmail(input: SendConfirmationEmailInput): Promise<void> {
  try {
    const gmail = await getGmailClient();

    const subject = `Submission Confirmation - ${input.uniqueId}`;
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: MJSTEM Editorial Office <${process.env.GOOGLE_IMPERSONATED_USER_EMAIL}>`,
      `To: ${input.authorName} <${input.authorEmail}>`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      `Dear ${input.authorName},`,
      `<br><br>`,
      `Thank you for submitting your manuscript, "${input.manuscriptTitle}", to MJSTEM.`,
      `Your submission ID is: <strong>${input.uniqueId}</strong>. Please include this ID in any future correspondence regarding this submission.`,
      `<br><br>`,
      `Your manuscript will now undergo an initial editorial check to ensure it meets our scope and formatting guidelines. You will be notified once this check is complete and the manuscript is sent for peer review.`,
      `<br><br>`,
      `Sincerely,`,
      `<br>`,
      `The MJSTEM Editorial Team`,
    ];
    const message = messageParts.join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
      
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('Confirmation email sent successfully to', input.authorEmail);

  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    // We don't want to throw an error here, as email failure shouldn't block the submission process.
    // In a production system, you'd add this to a retry queue.
  }
}
