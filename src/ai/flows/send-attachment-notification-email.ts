
'use server';
/**
 * @fileOverview A flow for sending an email when an editor attaches a file.
 */

import { z } from 'zod';
import nodemailer from 'nodemailer';

const SendAttachmentNotificationEmailSchema = z.object({
  authorEmail: z.string().email(),
  authorName: z.string(),
  editorName: z.string(),
  submissionId: z.string(),
  manuscriptTitle: z.string(),
  fileName: z.string(),
});
export type SendAttachmentNotificationEmailInput = z.infer<typeof SendAttachmentNotificationEmailSchema>;


export async function sendAttachmentNotificationEmail(input: SendAttachmentNotificationEmailInput): Promise<void> {
    const { 
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        MAIL_FROM,
        NEXT_PUBLIC_BASE_URL
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !NEXT_PUBLIC_BASE_URL) {
        console.error('Failed to send attachment notification email: SMTP environment variables are not fully configured.');
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

    const submissionLink = `${NEXT_PUBLIC_BASE_URL}/dashboard/submissions/${input.submissionId}`;

    const subject = `New File Attached to your Submission - MJSTEM`;
    const body = `Dear ${input.authorName},
<br><br>
A new file, "<b>${input.fileName}</b>", has been attached to your submission, "<i>${input.manuscriptTitle}</i>", by editor ${input.editorName}.
<br><br>
This file may contain feedback, annotated revisions, or other important information regarding your manuscript. Please log in to your dashboard to view and download the attachment.
<br><br>
<a href="${submissionLink}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Submission</a>
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
        console.log('Attachment notification email sent successfully to', input.authorEmail);
    } catch (error) {
        console.error('Failed to send attachment notification email:', error);
    }
}
