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
  const emailNorm = (email || '').toLowerCase().trim();

  if (!emailNorm) {
      console.warn("[Claim Invitations] No email provided for UID:", uid);
      return { success: false, message: 'Email is required.', count: 0 };
  }

  try {
    console.log(`[Claim Invitations] Checking invites for: ${emailNorm} (UID: ${uid})`);
    
    const invitesQuery = adminDb.collection('reviewInvitations')
      .where('emailNorm', '==', emailNorm)
      .where('status', '==', 'pending');

    const invitesSnapshot = await invitesQuery.get();

    if (invitesSnapshot.empty) {
      console.log(`[Claim Invitations] No pending invitations found for ${emailNorm}.`);
      return { success: true, message: 'No pending invitations found.', count: 0 };
    }

    console.log(`[Claim Invitations] Found ${invitesSnapshot.size} invitation(s). Starting transaction...`);

    let processedCount = 0;

    await adminDb.runTransaction(async (transaction) => {
      // 1. Fetch user doc to check role
      const userRef = adminDb.collection('users').doc(uid);
      const userDoc = await transaction.get(userRef);
      
      // If doc doesn't exist, we'll create it during promotion, 
      // but usually ensureUserDocument handled it.
      const userData = userDoc.data();
      
      // We promote if they are Author or if the doc doesn't even exist yet.
      const isEligibleForPromotion = !userData || userData.role === 'Author';

      for (const inviteDoc of invitesSnapshot.docs) {
        const inviteData = inviteDoc.data();
        const submissionId = inviteData.submissionId;
        const subRef = adminDb.collection('submissions').doc(submissionId);
        const subDoc = await transaction.get(subRef);

        if (subDoc.exists) {
          const subData = subDoc.data();
          const reviewers = subData?.reviewers || [];
          
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

          // If for some reason the email wasn't in the reviewers array but was invited, add it
          if (!foundInArray) {
              console.log(`[Claim Invitations] UID ${uid} not found in reviewers array for ${submissionId}. Adding entry.`);
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
        } else {
            console.warn(`[Claim Invitations] Submission ${submissionId} not found for invite ${inviteDoc.id}`);
        }

        // Mark the invitation as claimed
        transaction.update(inviteDoc.ref, {
          status: 'claimed',
          claimedByUid: uid,
          claimedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // 2. Promote role if they are currently just an Author or new
      if (isEligibleForPromotion) {
        console.log(`[Claim Invitations] Promoting user ${uid} to Reviewer.`);
        transaction.set(userRef, { role: 'Reviewer' }, { merge: true });
      }
    });

    console.log(`[Claim Invitations] Successfully claimed ${processedCount} invitation(s) for ${emailNorm}.`);
    return { 
        success: true, 
        message: `Successfully claimed ${processedCount} assignment(s).`, 
        count: processedCount 
    };

  } catch (error: any) {
    console.error("[Claim Invitations] Fatal Error:", error);
    return { success: false, message: error.message || 'An error occurred while claiming invitations.', count: 0 };
  }
}
