'use server';
/**
 * @fileOverview A server action for claiming reviewer invitations.
 * Now acts as a secondary safety net for the primary placeholder-based promotion.
 */

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

interface ClaimInvitationsInput {
  uid: string;
  email: string;
}

export async function claimReviewerInvitations(input: ClaimInvitationsInput): Promise<{ success: boolean; message: string; count: number }> {
  const { uid, email } = input;
  const emailNorm = (email || '').toLowerCase().trim();

  if (!adminDb || !emailNorm) {
    return { success: false, message: 'Invalid input or configuration.', count: 0 };
  }

  try {
    const invitesSnapshot = await adminDb.collection('reviewInvitations')
      .where('emailNorm', '==', emailNorm)
      .where('status', '==', 'pending')
      .get();

    if (invitesSnapshot.empty) {
      return { success: true, message: 'No pending invitations.', count: 0 };
    }

    let processedCount = 0;

    await adminDb.runTransaction(async (transaction) => {
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
          
          let foundInArray = false;
          const updatedReviewers = reviewers.map((r: any) => {
            const rEmail = (r.email || '').toLowerCase().trim();
            if (rEmail === emailNorm) {
              foundInArray = true;
              return { ...r, id: uid, status: r.status === 'Invited' ? 'Pending' : r.status };
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

      if (isEligibleForPromotion && processedCount > 0) {
        transaction.set(userRef, { role: 'Reviewer' }, { merge: true });
      }
    });

    return { 
        success: true, 
        message: `Linked ${processedCount} assignment(s).`, 
        count: processedCount 
    };

  } catch (error: any) {
    console.error("[Claim Invitations] Error:", error);
    return { success: false, message: error.message, count: 0 };
  }
}
