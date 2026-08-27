
'use server';
/**
 * @fileOverview A flow for sending a decision email to the author.
 */

import { z } from 'zod';
import nodemailer from 'nodemailer';
import { SubmissionStatus } from '@/types';

const SendDecisionEmailSchema = z.object({
  authorEmail: z.string().email(),
  authorName: z.string(),
  manuscriptTitle: z.string(),
  submissionId: z.string(),
  uniqueId: z.string(),
  decision: z.enum([
    'Accepted', 'Rejected', 'Minor Revision', 'Major Revision',
    'Revise and Resubmit',
    'Awaiting Revision: Similarity Issues'
  ]),
});
export type SendDecisionEmailInput = z.infer<typeof SendDecisionEmailSchema>;


function getEmailContent(decision: SubmissionStatus, title: string, subId: string): { subject: string, body: string } {
    const subject = `Update on your MJSTEM Submission: ${subId}`;
    let body = '';

    switch (decision) {
        case 'Accepted':
            body = `We are pleased to inform you that your manuscript, "${title}", has been **Accepted** for publication in MJSTEM.
            <br><br>Congratulations! Our editorial team will contact you shortly regarding the next steps in the publication process.`;
            break;
        case 'Rejected':
            body = `We regret to inform you that after careful consideration, your manuscript, "${title}", has been **Rejected** for publication in MJSTEM.
            <br><br>We thank you for considering our journal and wish you the best of luck with your future submissions. You can view reviewer comments in the author dashboard.`;
            break;
        case 'Minor Revision':
        case 'Major Revision':
            body = `Your manuscript, "${title}", requires **${decision}** before it can be further considered for publication.
            <br><br>Please log in to your author dashboard to view the reviewer comments and submit your revised manuscript.`;
            break;
        case 'Revise and Resubmit':
            body = `Your manuscript, "${title}", requires you to **revise and resubmit for further review** before it can be further considered for publication.
            <br><br>Please log in to your author dashboard to view the reviewer comments and submit your revised manuscript.`;
            break;
        case 'Awaiting Revision: Similarity Issues':
             body = `Your manuscript, "${title}", requires revision due to **similarity issues** found during our initial check.
            <br><br>Please log in to your author dashboard for more details and to submit a revised manuscript.`;
            break;
        default:
             body = `There has been an update on your submission, "${title}". Please log in to your author dashboard for details.`;
    }

    return { subject, body };
}


export async function sendDecisionEmail(input: SendDecisionEmailInput): Promise<void> {
    const { 
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        MAIL_FROM,
        NEXT_PUBLIC_BASE_URL
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !NEXT_PUBLIC_BASE_URL) {
        console.error('Failed to send decision email: SMTP environment variables are not fully configured.');
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

    const { subject, body: emailBody } = getEmailContent(input.decision, input.manuscriptTitle, input.uniqueId);

    const finalBody = `Dear ${input.authorName},
<br><br>
${emailBody}
<br><br>
You can view your submission details here:
<a href="${NEXT_PUBLIC_BASE_URL}/dashboard/submissions/${input.submissionId}">View Submission</a>
<br><br>
Sincerely,
<br>
The MJSTEM Editorial Team`;


    const mailOptions = {
        from: MAIL_FROM,
        to: input.authorEmail,
        subject: subject,
        html: finalBody,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Decision email sent successfully to', input.authorEmail);
    } catch (error) {
        console.error('Failed to send decision email:', error);
    }
}
