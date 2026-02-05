
'use server';
/**
 * @fileOverview A flow for sending a reviewer invitation email to a new user.
 */

import { z } from 'zod';
import nodemailer from 'nodemailer';

const SendReviewerInvitationEmailSchema = z.object({
  reviewerEmail: z.string().email(),
  reviewerName: z.string(),
  manuscriptTitle: z.string(),
  submissionId: z.string(),
});
export type SendReviewerInvitationEmailInput = z.infer<typeof SendReviewerInvitationEmailSchema>;


export async function sendReviewerInvitationEmail(input: SendReviewerInvitationEmailInput): Promise<void> {
    const { 
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        MAIL_FROM,
        NEXT_PUBLIC_BASE_URL
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !NEXT_PUBLIC_BASE_URL) {
        console.error('Failed to send reviewer invitation email: SMTP environment variables are not fully configured.');
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

    const signupLink = `${NEXT_PUBLIC_BASE_URL}/signup?email=${encodeURIComponent(input.reviewerEmail)}&redirectTo=/dashboard/submissions/${input.submissionId}`;

    const subject = `You're Invited to Review for MJSTEM`;
    const body = `Dear ${input.reviewerName},
<br><br>
You have been invited to review a manuscript, "${input.manuscriptTitle}", for the Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM). Your expertise in this area would be a great asset to our peer review process.
<br><br>
To accept this invitation and view the manuscript, please create an account using this email address.
<br><br>
<a href="${signupLink}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Create Account & Accept Invitation</a>
<br><br>
If you already have an account with this email, you can simply log in to view the assignment.
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
        console.log('Reviewer invitation email sent successfully to', input.reviewerEmail);
    } catch (error) {
        console.error('Failed to send invitation email:', error);
    }
}
