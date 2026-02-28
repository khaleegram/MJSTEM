'use server';
/**
 * @fileOverview A server action for claiming reviewer invitations.
 * Now acts as a secondary safety net for the primary placeholder-based promotion.
 */

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

let claimInvitationsDisabledDueToPermission = false;

function isPermissionDeniedError(error: any): boolean {
  return (
    error?.code === 7 ||
    error?.code === 'permission-denied' ||
    (typeof error?.details === 'string' && error.details.toLowerCase().includes('missing or insufficient permissions'))
  );
}

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
  const dbRef = adminDb;

  if (claimInvitationsDisabledDueToPermission) {
    return { success: false, message: 'Invitation claiming is currently disabled by server permissions.', count: 0 };
  }

  try {
    const invitesSnapshot = await dbRef.collection('reviewInvitations')
      .where('emailNorm', '==', emailNorm)
      .where('status', '==', 'pending')
      .get();

    if (invitesSnapshot.empty) {
      return { success: true, message: 'No pending invitations.', count: 0 };
    }

    let processedCount = 0;

    await dbRef.runTransaction(async (transaction) => {
      const userRef = dbRef.collection('users').doc(uid);
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data();
      
      const isEligibleForPromotion = !userData || userData.role === 'Author';
      const inviteEntries = invitesSnapshot.docs.map((inviteDoc) => ({
        ref: inviteDoc.ref,
        data: inviteDoc.data(),
      }));
      const submissionRefs = inviteEntries.map((invite) =>
        dbRef.collection('submissions').doc(invite.data.submissionId)
      );
      const submissionDocs = await Promise.all(submissionRefs.map((subRef) => transaction.get(subRef)));
      let localProcessedCount = 0;

      for (let i = 0; i < inviteEntries.length; i++) {
        const invite = inviteEntries[i];
        const subRef = submissionRefs[i];
        const subDoc = submissionDocs[i];

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
          
          localProcessedCount++;
        }

        transaction.update(invite.ref, {
          status: 'claimed',
          claimedByUid: uid,
          claimedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      if (isEligibleForPromotion && localProcessedCount > 0) {
        transaction.set(userRef, { role: 'Reviewer' }, { merge: true });
      }

      processedCount = localProcessedCount;
    });

    return { 
        success: true, 
        message: `Linked ${processedCount} assignment(s).`, 
        count: processedCount 
    };

  } catch (error: any) {
    if (isPermissionDeniedError(error)) {
      claimInvitationsDisabledDueToPermission = true;
      console.warn("[Claim Invitations] Disabled: service account lacks Firestore permission for review invitation queries.");
      return { success: false, message: 'Invitation claiming disabled due to service-account permissions.', count: 0 };
    }
    console.error("[Claim Invitations] Error:", error?.message || error);
    return { success: false, message: error.message, count: 0 };
  }
}
