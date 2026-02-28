'use client';

import { useEffect, useState } from 'react';
import { getLatestIssue, getFeaturedArticles, IssueWithVolume } from '@/services/publication-service';
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { IndexingService, Article } from '@/types';
import { HomePageClient } from '@/components/home-page-client';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function HomePage() {
  const [latestIssue, setLatestIssue] = useState<IssueWithVolume | null>(null);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [journalInfo, setJournalInfo] = useState<{ coverLetterUrl?: string, submissionTemplateUrl?: string }>({});
  const [indexingServices, setIndexingServices] = useState<IndexingService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // These functions now have internal error handling/emitting using FirestorePermissionError
      getLatestIssue().then(setLatestIssue);
      getFeaturedArticles().then(setFeaturedArticles);

      // Fetch branding and settings
      const journalInfoRef = doc(db, 'settings', 'journalInfo');
      getDoc(journalInfoRef)
        .then((docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setJournalInfo({
                    coverLetterUrl: data.coverLetterUrl,
                    submissionTemplateUrl: data.submissionTemplateUrl,
                });
            }
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: journalInfoRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
      
      const indexingCollectionRef = collection(db, 'indexingServices');
      const indexingQuery = query(indexingCollectionRef, orderBy('order'));
      getDocs(indexingQuery)
        .then((indexingSnapshot) => {
            const services = indexingSnapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    name: data.name,
                    logoUrl: data.logoUrl,
                    order: data.order 
                } as IndexingService;
            });
            setIndexingServices(services);
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: indexingCollectionRef.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setLoading(false);
        });
    };

    fetchData();
  }, []);

  return (
    <HomePageClient
      latestIssue={latestIssue}
      featuredArticles={featuredArticles}
      journalInfo={journalInfo}
      indexingServices={indexingServices}
    />
  );
}
