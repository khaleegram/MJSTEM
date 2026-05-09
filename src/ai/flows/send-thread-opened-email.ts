'use server';
/**
 * @fileOverview A flow for sending an email to an author when a message thread is opened.
 */

import { z } from 'zod';
import nodemailer from 'nodemailer';

const SendThreadOpenedEmailSchema = z.object({
  authorEmail: z.string().email(),
  authorName: z.string(),
  manuscriptTitle: z.string(),
  submissionId: z.string(),
});
export type SendThreadOpenedEmailInput = z.infer<typeof SendThreadOpenedEmailSchema>;

export async function sendThreadOpenedEmail(input: SendThreadOpenedEmailInput): Promise<void> {
    const { 
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        MAIL_FROM,
        NEXT_PUBLIC_BASE_URL
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !NEXT_PUBLIC_BASE_URL) {
        console.error('Failed to send thread opened email: SMTP environment variables are not fully configured.');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT, 10),
        secure: parseInt(SMTP_PORT, 10) === 465, 
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    const subject = `Message Thread Opened - ${input.manuscriptTitle}`;
    const body = `Dear ${input.authorName},
<br><br>
The Editor-in-Chief has opened a direct message thread regarding your manuscript, "${input.manuscriptTitle}".
<br><br>
You can now communicate directly with the editorial team and attach any additional files they may have requested.
<br><br>
Please access your submission to view and reply to messages:
<br>
<a href="${NEXT_PUBLIC_BASE_URL}/dashboard/submissions/${input.submissionId}">View Submission and Messages</a>
<br><br>
Sincerely,
<br>
The MJSTEM Editorial Team`;

    const mailOptions = {
        from: MAIL_FROM,
        to: input.authorEmail,
        subject: subject,
        html: body,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Thread opened email sent successfully to', input.authorEmail);
    } catch (error) {
        console.error('Failed to send thread opened email:', error);
    }
}
