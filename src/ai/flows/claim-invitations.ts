'use server';
/**
 * @fileOverview A server action for claiming reviewer invitations.
 * This runs with administrative privileges to securely link users to submissions
 * and promote their roles.
 */

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

interface ClaimInvitationsInput {
  uid: string;
  email: string;
}

export async function claimReviewerInvitations(input: ClaimInvitationsInput): Promise<{ success: boolean; message: string; count: number }> {
  if (!adminDb) {
    console.error("[Claim Invitations] Admin DB not initialized.");
    return { success: false, message: 'Server configuration error.', count: 0 };
  }

  const { uid, email } = input;
  const emailNorm = email.toLowerCase().trim();

  try {
    const invitesQuery = adminDb.collection('reviewInvitations')
      .where('emailNorm', '==', emailNorm)
      .where('status', '==', 'pending');

    const invitesSnapshot = await invitesQuery.get();

    if (invitesSnapshot.empty) {
      return { success: true, message: 'No pending invitations found.', count: 0 };
    }

    await adminDb.runTransaction(async (transaction) => {
      // 1. Fetch user doc to check role
      const userRef = adminDb.collection('users').doc(uid);
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data();
      
      const shouldPromote = userData?.role === 'Author';

      for (const inviteDoc of invitesSnapshot.docs) {
        const inviteData = inviteDoc.data();
        const submissionId = inviteData.submissionId;
        const subRef = adminDb.collection('submissions').doc(submissionId);
        const subDoc = await transaction.get(subRef);

        if (subDoc.exists) {
          const subData = subDoc.data();
          const reviewers = subData?.reviewers || [];
          
          // Link the UID to the reviewer entry matching this email
          const updatedReviewers = reviewers.map((r: any) => {
            if (r.email.toLowerCase().trim() === emailNorm && (r.status === 'Invited' || !r.id)) {
              return { ...r, id: uid, status: 'Pending' };
            }
            return r;
          });

          transaction.update(subRef, {
            reviewers: updatedReviewers,
            reviewerIds: admin.firestore.FieldValue.arrayUnion(uid),
            invitedReviewerEmails: admin.firestore.FieldValue.arrayRemove(email)
          });
        }

        // Mark the invitation as claimed
        transaction.update(inviteDoc.ref, {
          status: 'claimed',
          claimedByUid: uid,
          claimedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // 2. Promote role if they are currently just an Author
      if (shouldPromote) {
        transaction.update(userRef, { role: 'Reviewer' });
      }
    });

    console.log(`[Claim Invitations] Successfully claimed ${invitesSnapshot.size} invitation(s) for ${emailNorm}.`);
    return { success: true, message: `Successfully claimed ${invitesSnapshot.size} assignment(s).`, count: invitesSnapshot.size };

  } catch (error: any) {
    console.error("[Claim Invitations] Error:", error);
    return { success: false, message: error.message || 'An error occurred while claiming invitations.', count: 0 };
  }
}
