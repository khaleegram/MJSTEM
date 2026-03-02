'use server';
/**
 * @fileOverview Centralized workflow email notifications for key editorial events.
 */

import { z } from 'zod';
import nodemailer from 'nodemailer';
import { adminDb } from '@/lib/firebase-admin';

const WorkflowEventSchema = z.enum([
  'NEW_SUBMISSION_EDITOR_ALERT',
  'REVIEWER_INVITATION_ACCEPTED',
  'REVIEW_SUBMITTED',
  'REVIEW_UPDATED',
  'REVISION_SUBMITTED',
  'REVISION_REPLACED',
  'EDITOR_ATTACHMENT_SHARED_REVIEWERS',
]);

const SendWorkflowNotificationEmailSchema = z.object({
  event: WorkflowEventSchema,
  submissionId: z.string(),
  manuscriptTitle: z.string().optional(),
  actorName: z.string().optional(),
  round: z.number().int().nonnegative().optional(),
  recommendation: z.string().optional(),
  fileName: z.string().optional(),
  visibleToReviewers: z.boolean().optional(),
});

export type SendWorkflowNotificationEmailInput = z.infer<typeof SendWorkflowNotificationEmailSchema>;

type SubmissionSnapshot = {
  title: string;
  authorName: string;
  authorEmail: string;
  reviewerEmails: string[];
};

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase().trim() : '';
}

function dedupeEmails(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => normalizeEmail(value)).filter(Boolean)));
}

function getBaseUrl(): string {
  const direct = (process.env.NEXT_PUBLIC_BASE_URL || '').trim();
  if (direct) return direct.replace(/\/+$/, '');

  const vercelUrl = (process.env.VERCEL_URL || '').trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/+$/, '')}`;

  return '';
}

function getRoundLabel(round?: number): string {
  if (typeof round !== 'number' || round < 0) return 'Initial';
  return round > 0 ? `R${round}` : 'Initial';
}

async function fetchEditorialEmails(): Promise<string[]> {
  if (!adminDb) return [];

  try {
    const roles = ['Editor', 'Admin', 'Managing Editor'];
    const snapshot = await adminDb.collection('users').where('role', 'in', roles).get();
    return dedupeEmails(
      snapshot.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return typeof data.email === 'string' ? data.email : '';
      })
    );
  } catch (error) {
    console.error('[Workflow Email] Failed to load editorial recipients:', error);
    return [];
  }
}

async function fetchSubmissionSnapshot(submissionId: string): Promise<SubmissionSnapshot | null> {
  if (!adminDb) return null;

  try {
    const snapshot = await adminDb.collection('submissions').doc(submissionId).get();
    if (!snapshot.exists) return null;

    const data = snapshot.data() as Record<string, unknown>;
    const author = (data.author || {}) as Record<string, unknown>;
    const reviewers = Array.isArray(data.reviewers) ? (data.reviewers as Array<Record<string, unknown>>) : [];

    const reviewerEmails = dedupeEmails(
      reviewers
        .filter((reviewer) => {
          const status = typeof reviewer.status === 'string' ? reviewer.status : '';
          return status !== 'Invited';
        })
        .map((reviewer) => (typeof reviewer.email === 'string' ? reviewer.email : ''))
    );

    return {
      title: typeof data.title === 'string' ? data.title : '',
      authorName: typeof author.name === 'string' ? author.name : 'Author',
      authorEmail: typeof author.email === 'string' ? author.email : '',
      reviewerEmails,
    };
  } catch (error) {
    console.error('[Workflow Email] Failed to load submission snapshot:', error);
    return null;
  }
}

async function sendToRecipients(
  recipients: string[],
  subject: string,
  html: string,
  transporter: nodemailer.Transporter,
  from: string
): Promise<void> {
  const toList = dedupeEmails(recipients);
  if (toList.length === 0) return;

  const results = await Promise.allSettled(
    toList.map((to) =>
      transporter.sendMail({
        from,
        to,
        subject,
        html,
      })
    )
  );

  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length > 0) {
    console.error(`[Workflow Email] ${failures.length} email(s) failed for subject "${subject}".`);
  }
}

export async function sendWorkflowNotificationEmail(input: SendWorkflowNotificationEmailInput): Promise<void> {
  const parsed = SendWorkflowNotificationEmailSchema.safeParse(input);
  if (!parsed.success) {
    console.error('[Workflow Email] Invalid input:', parsed.error.flatten());
    return;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
  const baseUrl = getBaseUrl();

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !baseUrl) {
    console.error('[Workflow Email] SMTP or base URL environment is not fully configured.');
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

  const payload = parsed.data;
  const submission = await fetchSubmissionSnapshot(payload.submissionId);
  const manuscriptTitle = payload.manuscriptTitle?.trim() || submission?.title || 'Untitled Manuscript';
  const actorName = payload.actorName?.trim() || 'A user';
  const roundLabel = getRoundLabel(payload.round);
  const submissionUrl = `${baseUrl}/dashboard/submissions/${payload.submissionId}`;

  try {
    switch (payload.event) {
      case 'NEW_SUBMISSION_EDITOR_ALERT': {
        const editors = await fetchEditorialEmails();
        const subject = `New Submission Received - ${manuscriptTitle}`;
        const body = `Editorial Team,
<br><br>
A new manuscript has been submitted to MJSTEM.
<br><br>
<b>Title:</b> ${manuscriptTitle}<br>
<b>Submitted by:</b> ${submission?.authorName || actorName}
<br><br>
<a href="${submissionUrl}">Open Submission</a>
<br><br>
MJSTEM Automated Notifications`;
        await sendToRecipients(editors, subject, body, transporter, MAIL_FROM);
        break;
      }

      case 'REVIEWER_INVITATION_ACCEPTED': {
        const editors = await fetchEditorialEmails();
        const subject = `Reviewer Accepted Invitation - ${manuscriptTitle}`;
        const body = `Editorial Team,
<br><br>
A reviewer has accepted an invitation for this manuscript.
<br><br>
<b>Title:</b> ${manuscriptTitle}<br>
<b>Reviewer:</b> ${actorName}
<br><br>
<a href="${submissionUrl}">Open Submission</a>
<br><br>
MJSTEM Automated Notifications`;
        await sendToRecipients(editors, subject, body, transporter, MAIL_FROM);
        break;
      }

      case 'REVIEW_SUBMITTED':
      case 'REVIEW_UPDATED': {
        const editors = await fetchEditorialEmails();
        const actionLabel = payload.event === 'REVIEW_UPDATED' ? 'Review Updated' : 'Review Submitted';
        const recommendationLine = payload.recommendation
          ? `<b>Recommendation:</b> ${payload.recommendation}<br>`
          : '';
        const subject = `${actionLabel} (${roundLabel}) - ${manuscriptTitle}`;
        const body = `Editorial Team,
<br><br>
${actionLabel} has been recorded for this manuscript.
<br><br>
<b>Title:</b> ${manuscriptTitle}<br>
<b>Reviewer:</b> ${actorName}<br>
<b>Round:</b> ${roundLabel}<br>
${recommendationLine}
<a href="${submissionUrl}">Open Submission</a>
<br><br>
MJSTEM Automated Notifications`;
        await sendToRecipients(editors, subject, body, transporter, MAIL_FROM);
        break;
      }

      case 'REVISION_SUBMITTED': {
        const editors = await fetchEditorialEmails();
        const reviewerEmails = submission?.reviewerEmails || [];
        const authorEmail = normalizeEmail(submission?.authorEmail);
        const authorName = submission?.authorName || 'Author';

        const editorSubject = `Revision Submitted (${roundLabel}) - ${manuscriptTitle}`;
        const editorBody = `Editorial Team,
<br><br>
A revised manuscript package has been submitted.
<br><br>
<b>Title:</b> ${manuscriptTitle}<br>
<b>Round:</b> ${roundLabel}<br>
<b>Submitted by:</b> ${actorName}
<br><br>
<a href="${submissionUrl}">Open Submission</a>
<br><br>
MJSTEM Automated Notifications`;
        await sendToRecipients(editors, editorSubject, editorBody, transporter, MAIL_FROM);

        const reviewerSubject = `Revision Round Available (${roundLabel}) - ${manuscriptTitle}`;
        const reviewerBody = `Dear Reviewer,
<br><br>
A revised manuscript package is now available for your review.
<br><br>
<b>Title:</b> ${manuscriptTitle}<br>
<b>Round:</b> ${roundLabel}
<br><br>
Please review the updated files and submit your report from the dashboard.
<br><br>
<a href="${submissionUrl}">Open Submission</a>
<br><br>
MJSTEM Editorial Team`;
        await sendToRecipients(reviewerEmails, reviewerSubject, reviewerBody, transporter, MAIL_FROM);

        if (authorEmail) {
          const authorSubject = `Revision Package Received (${roundLabel}) - MJSTEM`;
          const authorBody = `Dear ${authorName},
<br><br>
We have received your revised manuscript package for:
<br>
<b>${manuscriptTitle}</b>
<br><br>
<b>Round:</b> ${roundLabel}
<br><br>
The editorial workflow has been updated.
<br><br>
<a href="${submissionUrl}">View Submission</a>
<br><br>
MJSTEM Editorial Team`;
          await sendToRecipients([authorEmail], authorSubject, authorBody, transporter, MAIL_FROM);
        }
        break;
      }

      case 'REVISION_REPLACED': {
        const editors = await fetchEditorialEmails();
        const subject = `Revised Manuscript Replaced (${roundLabel}) - ${manuscriptTitle}`;
        const body = `Editorial Team,
<br><br>
The revised manuscript file has been replaced.
<br><br>
<b>Title:</b> ${manuscriptTitle}<br>
<b>Round:</b> ${roundLabel}<br>
<b>Updated by:</b> ${actorName}
<br><br>
<a href="${submissionUrl}">Open Submission</a>
<br><br>
MJSTEM Automated Notifications`;
        await sendToRecipients(editors, subject, body, transporter, MAIL_FROM);
        break;
      }

      case 'EDITOR_ATTACHMENT_SHARED_REVIEWERS': {
        if (payload.visibleToReviewers !== true) {
          return;
        }
        const reviewerEmails = submission?.reviewerEmails || [];
        const fileLabel = payload.fileName?.trim() || 'an attachment';
        const subject = `New Editor Attachment Available - ${manuscriptTitle}`;
        const body = `Dear Reviewer,
<br><br>
An editor has shared ${fileLabel} for this submission.
<br><br>
<b>Title:</b> ${manuscriptTitle}<br>
<b>Round:</b> ${roundLabel}
<br><br>
<a href="${submissionUrl}">Open Submission</a>
<br><br>
MJSTEM Editorial Team`;
        await sendToRecipients(reviewerEmails, subject, body, transporter, MAIL_FROM);
        break;
      }
    }
  } catch (error) {
    console.error(`[Workflow Email] Failed to send workflow email for event ${payload.event}:`, error);
  }
}

