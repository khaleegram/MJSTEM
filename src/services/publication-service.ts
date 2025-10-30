import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Volume, Issue } from '@/types';

// Define a new type that includes the volume title with the issue.
export interface IssueWithVolume extends Issue {
    volumeTitle: string;
}

export async function getLatestIssue(): Promise<IssueWithVolume | null> {
    try {
        // Find the most recent volume by year, then by title or another field if year is not enough
        const volumeQuery = query(collection(db, 'volumes'), orderBy('year', 'desc'), limit(1));
        const volumeSnapshot = await getDocs(volumeQuery);

        if (volumeSnapshot.empty) {
            console.log("No volumes found.");
            return null;
        }

        const latestVolumeDoc = volumeSnapshot.docs[0];
        const latestVolume = latestVolumeDoc.data() as Volume;
        
        // Check if there are any issues in this volume
        if (!latestVolume.issues || latestVolume.issues.length === 0) {
            console.log("Latest volume has no issues.");
            return null;
        }
        
        // Assuming the last issue in the array is the latest.
        // A more robust system might have a `publishedAt` timestamp on the issue itself.
        const latestIssue = latestVolume.issues[latestVolume.issues.length - 1];

        return {
            ...latestIssue,
            volumeTitle: latestVolume.title,
        };

    } catch (error) {
        console.error("Error fetching latest issue:", error);
        return null;
    }
}
