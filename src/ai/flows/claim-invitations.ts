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
  // CRITICAL DEBUG LOG: If you don't see this in your server terminal, the action isn't running.
  console.log(`[Claim Invitations] HIT for email: ${input.email} (UID: ${input.uid})`);

  if (!adminDb) {
    console.error("[Claim Invitations] Admin DB not initialized.");
    return { success: false, message: 'Server configuration error: Admin DB missing.', count: 0 };
  }

  const { uid, email } = input;
  const emailNorm = (email || '').toLowerCase().trim();

  if (!emailNorm) {
      console.warn("[Claim Invitations] No email provided for UID:", uid);
      return { success: false, message: 'Email is required for claiming.', count: 0 };
  }

  try {
    // 1. Find all pending invitations for this email
    console.log(`[Claim Invitations] Querying 'reviewInvitations' where emailNorm == ${emailNorm} AND status == 'pending'`);
    const invitesSnapshot = await adminDb.collection('reviewInvitations')
      .where('emailNorm', '==', emailNorm)
      .where('status', '==', 'pending')
      .get();

    if (invitesSnapshot.empty) {
      console.log(`[Claim Invitations] Result: No pending invitations found for: ${emailNorm}`);
      return { success: true, message: 'No pending invitations found.', count: 0 };
    }

    console.log(`[Claim Invitations] Result: Found ${invitesSnapshot.size} pending invitation(s). Starting transaction...`);

    let processedCount = 0;

    // 2. Perform atomic updates across multiple documents
    await adminDb.runTransaction(async (transaction) => {
      // Get the latest user data to check current role
      const userRef = adminDb.collection('users').doc(uid);
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data();
      
      const isEligibleForPromotion = !userData || userData.role === 'Author';
      console.log(`[Claim Invitations] User current role: ${userData?.role || 'Unknown'}. Eligible for promotion: ${isEligibleForPromotion}`);

      for (const inviteDoc of invitesSnapshot.docs) {
        const inviteData = inviteDoc.data();
        const submissionId = inviteData.submissionId;
        const subRef = adminDb.collection('submissions').doc(submissionId);
        const subDoc = await transaction.get(subRef);

        if (subDoc.exists) {
          const subData = subDoc.data() || {};
          const reviewers = subData.reviewers || [];
          
          console.log(`[Claim Invitations] Processing submission: ${submissionId}`);

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
              console.log(`[Claim Invitations] Email ${emailNorm} not found in reviewers array, appending new entry.`);
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
            console.warn(`[Claim Invitations] Referenced submission ${submissionId} does not exist.`);
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
        console.log(`[Claim Invitations] PROMOTING user ${uid} to Reviewer role.`);
        transaction.set(userRef, { role: 'Reviewer' }, { merge: true });
      } else {
          console.log(`[Claim Invitations] User already has advanced role (${userData?.role}), skipping promotion.`);
      }
    });

    console.log(`[Claim Invitations] Transaction complete. Processed ${processedCount} documents.`);
    return { 
        success: true, 
        message: `Successfully claimed ${processedCount} assignment(s).`, 
        count: processedCount 
    };

  } catch (error: any) {
    console.error("[Claim Invitations] FATAL ERROR:", error);
    return { success: false, message: `Server error: ${error.message || 'Unknown error'}`, count: 0 };
  }
}
