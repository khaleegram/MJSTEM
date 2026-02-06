'use server';
/**
 * @fileOverview A flow for deleting a user from the system.
 */

import admin from '@/lib/firebase-admin';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';

const DeleteUserInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
});
export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

export async function deleteUser(input: DeleteUserInput): Promise<{ success: boolean; message: string }> {
    if (admin.apps.length === 0) {
        console.error("[Delete User] Firebase Admin SDK not initialized.");
        throw new Error("Server is not configured to delete users.");
    }
    
    const { userId } = input;

    // 1. Safety Check: Ensure the user is not the author of any submissions.
    const submissionsRef = collection(db, 'submissions');
    const q = query(submissionsRef, where('author.id', '==', userId));
    const authoredSubmissions = await getDocs(q);

    if (!authoredSubmissions.empty) {
        return {
            success: false,
            message: `This user is the author of ${authoredSubmissions.size} submission(s). Please reassign or delete them before deleting this user.`
        };
    }
    
    try {
        const batch = writeBatch(db);

        // 2. Delete from Firestore DB
        const userDocRef = doc(db, 'users', userId);
        batch.delete(userDocRef);

        // 3. Delete from Editorial Board if they exist there
        const boardQuery = query(collection(db, 'editorialBoard'), where('userId', '==', userId));
        const boardSnapshot = await getDocs(boardQuery);
        if (!boardSnapshot.empty) {
            boardSnapshot.forEach(boardDoc => {
                batch.delete(boardDoc.ref);
            });
        }
        
        // Commit Firestore deletions
        await batch.commit();

        // 4. Delete from Firebase Authentication (last step, as it's irreversible)
        await admin.auth().deleteUser(userId);

        return { success: true, message: 'User successfully deleted.' };

    } catch (error: any) {
        console.error('Failed to delete user:', error);
        throw new Error(error.message || 'An unexpected error occurred while deleting the user.');
    }
}
