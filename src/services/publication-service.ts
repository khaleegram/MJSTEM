'use client';

import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Volume, Issue, Article } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Define a new type that includes the volume title with the issue.
export interface IssueWithVolume extends Issue {
    volumeTitle: string;
}

export async function getLatestIssue(): Promise<IssueWithVolume | null> {
    const volumeCollectionRef = collection(db, 'volumes');
    const volumeQuery = query(volumeCollectionRef, orderBy('year', 'desc'), limit(1));

    return getDocs(volumeQuery)
        .then((volumeSnapshot) => {
            if (volumeSnapshot.empty) {
                return null;
            }

            const latestVolumeDoc = volumeSnapshot.docs[0];
            const latestVolume = { id: latestVolumeDoc.id, ...latestVolumeDoc.data() } as Volume;
            
            if (!latestVolume.issues || latestVolume.issues.length === 0) {
                return null;
            }
            
            for (let i = latestVolume.issues.length - 1; i >= 0; i--) {
                const issue = latestVolume.issues[i];
                if (issue.articles && issue.articles.length > 0) {
                     return {
                        ...issue,
                        volumeTitle: latestVolume.title,
                    };
                }
            }
            return null;
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: volumeCollectionRef.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            return null;
        });
}

export async function getFeaturedArticles(): Promise<Article[]> {
    const submissionsCollectionRef = collection(db, 'submissions');
    const articlesQuery = query(
        submissionsCollectionRef,
        where('status', '==', 'Accepted'),
        orderBy('submittedAt', 'desc'),
        limit(3)
    );

    return getDocs(articlesQuery)
        .then((articlesSnapshot) => {
            if (articlesSnapshot.empty) {
                return [];
            }

            return articlesSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    contributors: data.contributors,
                    manuscriptUrl: data.manuscriptUrl,
                    authorName: data.author.name,
                    uniqueId: data.uniqueId,
                    doi: data.doi,
                } as Article;
            });
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: submissionsCollectionRef.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            return [];
        });
}
