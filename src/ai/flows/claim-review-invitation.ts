
'use server';
/**
 * @fileOverview A secure server-side flow for a user to claim a review invitation.
 * This flow links their user ID to the submission and promotes their role to 'Reviewer' if needed.
 */

import { z } from 'zod';
import admin from '@/lib/firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { Submission, UserProfile } from '@/types';

const ClaimReviewInvitationInputSchema = z.object({
  userId: z.string(),
  userEmail: z.string().email(),
  submissionId: z.string(),
});
export type ClaimReviewInvitationInput = z.infer<typeof ClaimReviewInvitationInputSchema>;

export async function claimReviewInvitation(input: ClaimReviewInvitationInput): Promise<{ success: boolean; message: string }> {
    const { userId, userEmail, submissionId } = input;
    
    if (!adminDb) {
        console.error("[Claim Invitation] Server admin database is not configured.");
        throw new Error("Server is not configured for this action.");
    }
    
    const submissionRef = adminDb.collection('submissions').doc(submissionId);
    const userRef = adminDb.collection('users').doc(userId);

    try {
        await adminDb.runTransaction(async (transaction) => {
            const subDoc = await transaction.get(submissionRef);
            const userDoc = await transaction.get(userRef);

            if (!subDoc.exists()) throw new Error("Submission not found.");
            if (!userDoc.exists()) throw new Error("User profile not found.");

            const submissionData = subDoc.data() as Submission;
            const userData = userDoc.data() as UserProfile;

            // Check if user was actually invited and has not claimed it yet
            if (!submissionData.invitedReviewerEmails?.includes(userEmail)) {
                // Not an error, just means it was already claimed or they weren't invited.
                // Silently succeed.
                return;
            }

            // Update submission to link the UID
            const updatedReviewers = submissionData.reviewers?.map(r => 
                (r.email === userEmail && r.status === 'Invited') 
                ? { ...r, id: userId, status: 'Pending' as const } 
                : r
            ) || [];
            
            transaction.update(submissionRef, {
                reviewers: updatedReviewers,
                reviewerIds: admin.firestore.FieldValue.arrayUnion(userId),
                invitedReviewerEmails: admin.firestore.FieldValue.arrayRemove(userEmail)
            });

            // Update user role to Reviewer if they are currently just an Author
            if (userData.role === 'Author') {
                transaction.update(userRef, { role: 'Reviewer' });
            }
        });
        
        return { success: true, message: 'Invitation claimed successfully.' };

    } catch (error: any) {
        console.error('Error claiming invitation:', error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
}
