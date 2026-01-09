
'use server';
/**
 * @fileOverview A flow for sending a submission confirmation email using AWS SES via SMTP.
 */

import { z } from 'zod';
import nodemailer from 'nodemailer';

const SendConfirmationEmailSchema = z.object({
  authorEmail: z.string().email(),
  authorName: z.string(),
  manuscriptTitle: z.string(),
  uniqueId: z.string(),
});
export type SendConfirmationEmailInput = z.infer<typeof SendConfirmationEmailSchema>;


export async function sendConfirmationEmail(input: SendConfirmationEmailInput): Promise<void> {
    const { 
        SES_SMTP_HOST, 
        SES_SMTP_USER, 
        SES_SMTP_PASS, 
        SES_FROM_EMAIL 
    } = process.env;

    if (!SES_SMTP_HOST || !SES_SMTP_USER || !SES_SMTP_PASS || !SES_FROM_EMAIL) {
        console.error('Failed to send confirmation email: SMTP environment variables are not fully configured.');
        // Do not throw an error to the client, as the submission itself was successful.
        return;
    }

    const transporter = nodemailer.createTransport({
        host: SES_SMTP_HOST,
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: SES_SMTP_USER,
            pass: SES_SMTP_PASS,
        },
    });

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

    const mailOptions = {
        from: `"MJSTEM Editorial Team" <${SES_FROM_EMAIL}>`,
        to: input.authorEmail,
        subject: subject,
        html: body,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent successfully to', input.authorEmail, 'via AWS SES SMTP.');
    } catch (error) {
        console.error('Failed to send confirmation email via AWS SES SMTP:', error);
        // In a production system, you might add this to a retry queue.
        // We still don't want to throw an error to the client.
    }
}
