'use client';
import { z } from 'zod';

const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

export const ContributorSchema = z.object({
  name: z.string().min(1, 'Contributor name is required.'),
  email: z.string().email('Please enter a valid email for the contributor.'),
  institution: z.string().min(1, 'Institution is required.'),
  orcid: z.string().refine(val => val === '' || orcidRegex.test(val), {
    message: "Invalid ORCID iD format. Expected: 0000-0000-0000-0000",
  }).optional(),
  role: z.string().default('Author'),
  isPrimaryContact: z.boolean().default(false),
});

export const EditorAttachmentSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  uploadedAt: z.any(),
  round: z.number().int().nonnegative().optional(),
  visibleToReviewers: z.boolean().optional(),
  uploadedBy: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
  }).optional(),
});

export const RevisionManuscriptSchema = z.object({
  revision: z.number().int().nonnegative(),
  url: z.string().url(),
  uploadedAt: z.any().optional(),
  replaced: z.boolean().optional(),
});

export const RevisionDocumentSchema = z.object({
  id: z.string().optional(),
  category: z.enum([
    'revised_manuscript_clean',
    'revised_manuscript_blinded',
    'response_to_reviewers',
    'tracked_changes',
    'supplementary',
    'figure_table',
    'ethics',
    'cover_letter',
    'additional',
  ]),
  label: z.string(),
  url: z.string().url(),
  fileName: z.string().optional(),
  uploadedAt: z.any().optional(),
  visibleToReviewers: z.boolean().optional(),
  required: z.boolean().optional(),
});

export const RevisionPackageSchema = z.object({
  round: z.number().int().positive(),
  status: z.enum(['submitted']),
  submittedAt: z.any().optional(),
  submittedBy: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
  }).optional(),
  documents: z.array(RevisionDocumentSchema),
});

export const NewSubmissionSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters long.'),
  abstract: z.string().min(50, 'Abstract must be at least 50 characters long.'),
  keywords: z.string().min(3, 'Please provide at least one keyword.'),
  manuscriptUrl: z.string().url('Manuscript file is required.'),
  blindedManuscriptUrl: z.string().url('A blinded (anonymous) manuscript is required for double-blind peer review.'),
  supplementaryFileUrl: z.string().url().optional().or(z.literal('')),
  contributors: z.array(ContributorSchema).min(1, 'At least one contributor is required.'),
  pageCount: z.number().optional(),
});


export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  photoURL: z.string().url().optional(),
  role: z.enum(['Editor', 'Author', 'Reviewer', 'Admin', 'Managing Editor']),
  specialization: z.string().optional(),
  reviewerSubjectAreas: z.array(z.string()).optional(),
  isReviewerVolunteer: z.boolean().optional(),
  fcmTokens: z.array(z.string()).optional(), // For Push Notifications
});

export const AssignedReviewerSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
  email: z.string().email(),
  status: z.enum(['Pending', 'Review Submitted', 'Invited']),
  lastReviewedRound: z.number().int().nonnegative().optional(),
  lastReviewedAt: z.any().optional(),
});

export const SubmissionSchema = z.object({
  id: z.string().optional(),
  uniqueId: z.string().optional(),
  title: z.string().min(10, 'Title must be at least 10 characters long.'),
  author: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  }),
  contributors: z.array(ContributorSchema).optional(),
  submittedAt: z.date(),
  status: z.enum([
    'Submitted',
    'With Editor',
    'Under Initial Review',
    'Under Peer Review',
    'Under Review-R1',
    'Under Review-R2',
    'Minor Revision',
    'Major Revision',
    'Revise and Resubmit',
    'Awaiting Revision: Similarity Issues',
    'Accepted',
    'Rejected',
  ]),
  abstract: z.string().min(50, 'Abstract must be at least 50 characters long.'),
  keywords: z.string().min(3, 'Please provide at least one keyword.'),
  manuscriptUrl: z.string().url().min(1, 'Manuscript file is required.'),
  blindedManuscriptUrl: z.string().url().optional(),
  originalManuscriptUrl: z.string().url().optional(),
  supplementaryFileUrl: z.string().url().optional(),
  reviewers: z.array(AssignedReviewerSchema).optional(),
  reviewerIds: z.array(z.string()).optional(), // For querying claimed reviews
  invitedReviewerEmails: z.array(z.string()).optional(), // For querying pending invites
  originalSubmissionDate: z.date().optional().nullable(),
  pageCount: z.number().optional(),
  revision: z.number().default(0),
  revisionManuscripts: z.array(RevisionManuscriptSchema).optional(),
  revisionPackages: z.array(RevisionPackageSchema).optional(),
  editorAttachments: z.array(EditorAttachmentSchema).optional(),
  doi: z.string().optional(),
});

export const ArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  authorName: z.string(),
  manuscriptUrl: z.string().url(),
  contributors: z.array(ContributorSchema).optional(),
  pageCount: z.number().optional(),
  uniqueId: z.string().optional(),
  doi: z.string().optional(),
});

export const IssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  articles: z.array(ArticleSchema).optional(),
});

export const VolumeSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number(),
  issues: z.array(IssueSchema).optional(),
});

export const EditorialBoardMemberSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(), // Link to user profile if they are a system user
  name: z.string().min(1, "Name is required."),
  qualifications: z.string().optional(),
  affiliation: z.string().min(1, "Affiliation is required."),
  country: z.string().optional(),
  role: z.enum(['Editor-in-Chief', 'Associate Editor', 'Founding Editor', 'Senior Associate Editor']),
  photoURL: z.string().url().optional(),
  orcid: z.string().refine(val => val === '' || !val || orcidRegex.test(val), {
    message: "Invalid ORCID iD format. Expected: 0000-0000-0000-0000",
  }).optional(),
  order: z.number().optional(),
});

export const NotificationSchema = z.object({
    id: z.string().optional(),
    userId: z.string(),
    message: z.string(),
    link: z.string(),
    timestamp: z.any(),
    read: z.boolean(),
    icon: z.string(),
});

export const IndexingServiceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Service name is required."),
  logoUrl: z.string().url("A valid logo URL is required."),
  order: z.number().optional(),
});

export const ReviewInvitationSchema = z.object({
  submissionId: z.string(),
  emailNorm: z.string(),
  invitedBy: z.string(),
  status: z.enum(['pending', 'claimed', 'revoked']),
  claimedByUid: z.string().optional(),
  createdAt: z.any(),
  claimedAt: z.any().optional(),
});
