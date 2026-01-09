
'use server';

import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * A server action to securely get the next sequential submission ID.
 * This runs a Firestore transaction to prevent race conditions.
 */
export async function getNextSubmissionIdAction(): Promise<string> {
    const counterRef = doc(db, 'settings', 'submissionCounter');
    const year = new Date().getFullYear().toString().slice(-2); // e.g., 24

    const newCount = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists() || !counterDoc.data().counts || !counterDoc.data().counts[year]) {
            // Initialize for the year
            const initialCounts = counterDoc.exists() ? counterDoc.data().counts || {} : {};
            initialCounts[year] = 1;
            transaction.set(counterRef, { counts: initialCounts }, { merge: true });
            return 1;
        } else {
            const currentCount = counterDoc.data().counts[year];
            const newCount = currentCount + 1;
            const newCounts = { ...counterDoc.data().counts, [year]: newCount };
            transaction.update(counterRef, { counts: newCounts });
            return newCount;
        }
    });

    const paddedCount = newCount.toString().padStart(3, '0');
    return `MJSTEM-S-${year}-${paddedCount}`;
}
