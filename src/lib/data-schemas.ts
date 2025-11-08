
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

export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum(['Editor', 'Author', 'Reviewer', 'Admin']),
  specialization: z.string().optional(),
});

export const AssignedReviewerSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['Pending', 'Review Submitted']),
});

export const SubmissionSchema = z.object({
  id: z.string().optional(),
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
    'Under Initial Review',
    'Under Peer Review',
    'Minor Revision',
    'Major Revision',
    'Accepted',
    'Rejected',
    'Uploading',
  ]),
  abstract: z.string().min(50, 'Abstract must be at least 50 characters long.'),
  keywords: z.string().min(3, 'Please provide at least one keyword.'),
  manuscriptUrl: z.string().url().min(1, 'Manuscript file is required.'),
  reviewers: z.array(AssignedReviewerSchema).optional(),
  reviewerIds: z.array(z.string()).optional(), // For querying
});

export const ArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  authorName: z.string(),
  manuscriptUrl: z.string().url(),
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
  imageSeed: z.string().min(1, "Image Seed is required."),
  order: z.number().optional(),
});
