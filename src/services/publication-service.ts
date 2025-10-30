import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Volume, Issue, Article } from '@/types';

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
        const latestVolume = { id: latestVolumeDoc.id, ...latestVolumeDoc.data() } as Volume;
        
        // Check if there are any issues in this volume and if they have articles
        if (!latestVolume.issues || latestVolume.issues.length === 0) {
            console.log("Latest volume has no issues.");
            return null;
        }
        
        // Find the latest issue that actually has articles
        // We iterate backwards from the last issue added
        for (let i = latestVolume.issues.length - 1; i >= 0; i--) {
            const issue = latestVolume.issues[i];
            if (issue.articles && issue.articles.length > 0) {
                 return {
                    ...issue,
                    volumeTitle: latestVolume.title,
                };
            }
        }
        
        console.log("No issues with articles found in the latest volume.");
        return null;


    } catch (error) {
        console.error("Error fetching latest issue:", error);
        return null;
    }
}
