
import { z } from 'zod';
import { UserProfileSchema, AssignedReviewerSchema, SubmissionSchema, VolumeSchema, IssueSchema, ArticleSchema, EditorialBoardMemberSchema, ContributorSchema } from '@/lib/data-schemas';


export type SubmissionStatus = z.infer<typeof SubmissionSchema.shape.status>;

export type UserRole = z.infer<typeof UserProfileSchema.shape.role>;

export type UserProfile = z.infer<typeof UserProfileSchema>;

export type AssignedReviewer = z.infer<typeof AssignedReviewerSchema>;

// This is a loosened version for client-side use where ID is not available until after creation
export type Submission = z.infer<typeof SubmissionSchema> & { id: string };

export type Contributor = z.infer<typeof ContributorSchema>;

// This is now mostly derived from UserProfile, but kept for clarity in reviewer-specific contexts
export interface Reviewer extends UserProfile {
  reviewsCompleted?: number;
  avgReviewTimeDays?: number;
}

export type Volume = z.infer<typeof VolumeSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type Article = z.infer<typeof ArticleSchema>;
export type EditorialBoardMember = z.infer<typeof EditorialBoardMemberSchema>;
