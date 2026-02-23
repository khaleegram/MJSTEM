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
 */
export async function claimReviewerInvitations(input: ClaimInvitationsInput): Promise<{ success: boolean; message: string; count: number }> {
  const { uid, email } = input;
  const emailNorm = (email || '').toLowerCase().trim();

  console.log(`[Claim Invitations] HIT for email: ${emailNorm} (UID: ${uid})`);

  if (!adminDb) {
    console.error("[Claim Invitations] Admin DB not initialized.");
    return { success: false, message: 'Server configuration error: Admin DB missing.', count: 0 };
  }

  if (!emailNorm) {
      return { success: false, message: 'Email is required for claiming.', count: 0 };
  }

  try {
    // 1. Find all pending invitations for this email
    console.log(`[Claim Invitations] Step 1: Querying pending invitations for ${emailNorm}`);
    const invitesSnapshot = await adminDb.collection('reviewInvitations')
      .where('emailNorm', '==', emailNorm)
      .where('status', '==', 'pending')
      .get();

    if (invitesSnapshot.empty) {
      console.log(`[Claim Invitations] Result: No pending invitations found.`);
      return { success: true, message: 'No pending invitations found.', count: 0 };
    }

    console.log(`[Claim Invitations] Step 2: Found ${invitesSnapshot.size} invitation(s). Starting transaction...`);

    let processedCount = 0;

    await adminDb.runTransaction(async (transaction) => {
      // Get the latest user data to check current role
      const userRef = adminDb.collection('users').doc(uid);
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data();
      
      const isEligibleForPromotion = !userData || userData.role === 'Author';
      console.log(`[Claim Invitations] User eligible for promotion: ${isEligibleForPromotion}`);

      for (const inviteDoc of invitesSnapshot.docs) {
        const inviteData = inviteDoc.data();
        const submissionId = inviteData.submissionId;
        const subRef = adminDb.collection('submissions').doc(submissionId);
        const subDoc = await transaction.get(subRef);

        if (subDoc.exists) {
          const subData = subDoc.data() || {};
          const reviewers = subData.reviewers || [];
          
          let foundInArray = false;
          const updatedReviewers = reviewers.map((r: any) => {
            const rEmail = (r.email || '').toLowerCase().trim();
            if (rEmail === emailNorm && (r.status === 'Invited' || !r.id)) {
              foundInArray = true;
              return { ...r, id: uid, status: 'Pending' };
            }
            return r;
          });

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

        transaction.update(inviteDoc.ref, {
          status: 'claimed',
          claimedByUid: uid,
          claimedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      if (isEligibleForPromotion) {
        console.log(`[Claim Invitations] Promoting user to Reviewer role.`);
        transaction.set(userRef, { role: 'Reviewer' }, { merge: true });
      }
    });

    console.log(`[Claim Invitations] SUCCESS: Processed ${processedCount} documents.`);
    return { 
        success: true, 
        message: `Successfully claimed ${processedCount} assignment(s).`, 
        count: processedCount 
    };

  } catch (error: any) {
    console.error("[Claim Invitations] FATAL ERROR:", error);
    // Return the literal error message to the client for debugging
    return { success: false, message: `Server error: ${error.message || 'Unknown error'}`, count: 0 };
  }
}
