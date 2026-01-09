
'use server';
/**
 * @fileOverview A flow for sending a submission confirmation email using AWS SES.
 */

import { z } from 'zod';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const SendConfirmationEmailSchema = z.object({
  authorEmail: z.string().email(),
  authorName: z.string(),
  manuscriptTitle: z.string(),
  uniqueId: z.string(),
});
export type SendConfirmationEmailInput = z.infer<typeof SendConfirmationEmailSchema>;

function getSESClient() {
    const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

    if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
        throw new Error("AWS credentials or region are not configured in environment variables.");
    }

    return new SESv2Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
    });
}

export async function sendConfirmationEmail(input: SendConfirmationEmailInput): Promise<void> {
    const { SES_FROM_ADDRESS } = process.env;

    if (!SES_FROM_ADDRESS) {
        console.error('Failed to send confirmation email: SES_FROM_ADDRESS is not set.');
        // Do not throw an error to the client, as the submission itself was successful.
        return;
    }

    try {
        const sesClient = getSESClient();

        const subject = `Submission Confirmation - ${input.uniqueId}`;
        const body = `Dear ${input.authorName},
<br><br>
Thank you for submitting your manuscript, "${input.manuscriptTitle}", to MJSTEM.
Your submission ID is: <strong>${input.uniqueId}</strong>. Please include this ID in any future correspondence regarding this submission.
<br><br>
Your manuscript will now undergo an initial editorial check to ensure it meets our scope and formatting guidelines. You will be notified once this check is complete and the manuscript is sent for peer review.
<br><br>
Sincerely,
<br>
The MJSTEM Editorial Team`;

        const command = new SendEmailCommand({
            FromEmailAddress: SES_FROM_ADDRESS,
            Destination: {
                ToAddresses: [input.authorEmail],
            },
            Content: {
                Simple: {
                    Subject: {
                        Data: subject,
                        Charset: 'UTF-8',
                    },
                    Body: {
                        Html: {
                            Data: body,
                            Charset: 'UTF-8',
                        },
                    },
                },
            },
        });

        await sesClient.send(command);

        console.log('Confirmation email sent successfully to', input.authorEmail, 'via AWS SES.');

    } catch (error) {
        console.error('Failed to send confirmation email via AWS SES:', error);
        // In a production system, you'd add this to a retry queue.
        // We still don't want to throw an error to the client.
    }
}
