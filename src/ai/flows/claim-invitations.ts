'use server';
/**
 * @fileOverview A server action for claiming reviewer invitations.
 * This runs with administrative privileges to securely link users to submissions
 * and promote their roles in an atomic transaction.
 */

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

interface ClaimInvitationsInput {
  uid: string;
  email: string;
}

/**
 * Professional transactional claim logic.
 * 1. Finds all "pending" invitations for the normalized email.
 * 2. For each, links UID to submission reviewers array and ID metadata.
 * 3. Marks invitation as "claimed".
 * 4. Promotes user role to 'Reviewer' if they are currently an 'Author'.
 */
export async function claimReviewerInvitations(input: ClaimInvitationsInput): Promise<{ success: boolean; message: string; count: number }> {
  if (!adminDb) {
    console.error("[Claim Invitations] Admin DB not initialized.");
    return { success: false, message: 'Server configuration error.', count: 0 };
  }

  const { uid, email } = input;
  const emailNorm = (email || '').toLowerCase().trim();

  if (!emailNorm) {
      return { success: false, message: 'Email is required.', count: 0 };
  }

  try {
    // 1. Find all pending invitations for this email
    const invitesSnapshot = await adminDb.collection('reviewInvitations')
      .where('emailNorm', '==', emailNorm)
      .where('status', '==', 'pending')
      .get();

    if (invitesSnapshot.empty) {
      return { success: true, message: 'No pending invitations.', count: 0 };
    }

    let processedCount = 0;

    // 2. Perform atomic updates across multiple documents
    await adminDb.runTransaction(async (transaction) => {
      // Get the latest user data to check current role
      const userRef = adminDb.collection('users').doc(uid);
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data();
      
      const isEligibleForPromotion = !userData || userData.role === 'Author';

      for (const inviteDoc of invitesSnapshot.docs) {
        const inviteData = inviteDoc.data();
        const submissionId = inviteData.submissionId;
        const subRef = adminDb.collection('submissions').doc(submissionId);
        const subDoc = await transaction.get(subRef);

        if (subDoc.exists) {
          const subData = subDoc.data() || {};
          const reviewers = subData.reviewers || [];
          
          // Link the UID to the reviewer entry matching this email
          let foundInArray = false;
          const updatedReviewers = reviewers.map((r: any) => {
            const rEmail = (r.email || '').toLowerCase().trim();
            if (rEmail === emailNorm && (r.status === 'Invited' || !r.id)) {
              foundInArray = true;
              return { ...r, id: uid, status: 'Pending' };
            }
            return r;
          });

          // Fallback: If email wasn't in array but doc exists, add it
          if (!foundInArray) {
              updatedReviewers.push({
                  id: uid,
                  email: emailNorm,
                  name: userData?.displayName || 'Reviewer',
                  status: 'Pending'
              });
          }

          transaction.update(subRef, {
            reviewers: updatedReviewers,
            reviewerIds: admin.firestore.FieldValue.arrayUnion(uid),
            invitedReviewerEmails: admin.firestore.FieldValue.arrayRemove(emailNorm)
          });
          
          processedCount++;
        }

        // Mark the invitation as claimed
        transaction.update(inviteDoc.ref, {
          status: 'claimed',
          claimedByUid: uid,
          claimedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // 3. Promote role if they are an Author (Editorial/Admin roles are never demoted)
      if (isEligibleForPromotion) {
        transaction.set(userRef, { role: 'Reviewer' }, { merge: true });
      }
    });

    return { 
        success: true, 
        message: `Successfully claimed ${processedCount} assignment(s).`, 
        count: processedCount 
    };

  } catch (error: any) {
    console.error("[Claim Invitations] Fatal Error:", error);
    return { success: false, message: error.message || 'An error occurred.', count: 0 };
  }
}
