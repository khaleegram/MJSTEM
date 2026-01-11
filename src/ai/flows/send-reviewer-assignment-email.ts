
'use server';
/**
 * @fileOverview A flow for sending a reviewer assignment email.
 */

import { z } from 'zod';
import nodemailer from 'nodemailer';

const SendReviewerAssignmentEmailSchema = z.object({
  reviewerEmail: z.string().email(),
  reviewerName: z.string(),
  manuscriptTitle: z.string(),
  submissionId: z.string(),
});
export type SendReviewerAssignmentEmailInput = z.infer<typeof SendReviewerAssignmentEmailSchema>;


export async function sendReviewerAssignmentEmail(input: SendReviewerAssignmentEmailInput): Promise<void> {
    const { 
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        MAIL_FROM
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
        console.error('Failed to send reviewer assignment email: SMTP environment variables are not fully configured.');
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

    const subject = `Review Invitation - MJSTEM`;
    const body = `Dear ${input.reviewerName},
<br><br>
You have been invited to review a new manuscript, "${input.manuscriptTitle}", for the Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM).
<br><br>
Your expertise in this area is highly valued, and we would be grateful for your contribution to the peer review process.
<br><br>
You can access the submission and submit your review by following this link:
<a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/submissions/${input.submissionId}">View Submission</a>
<br><br>
Thank you for considering this request.
<br><br>
Sincerely,
<br>
The MJSTEM Editorial Team`;

    const mailOptions = {
        from: MAIL_FROM,
        to: input.reviewerEmail,
        subject: subject,
        html: body,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reviewer assignment email sent successfully to', input.reviewerEmail);
    } catch (error) {
        console.error('Failed to send assignment email:', error);
    }
}
