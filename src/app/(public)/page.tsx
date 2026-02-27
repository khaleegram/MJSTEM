import { PublicHeader } from '@/components/public-header';
import { getLatestIssue, getFeaturedArticles } from '@/services/publication-service';
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { IndexingService } from '@/types';
import { HomePageClient } from '@/components/home-page-client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let latestIssue = null;
  let featuredArticles: any[] = [];
  let journalInfo: { coverLetterUrl?: string, submissionTemplateUrl?: string } = {};
  let indexingServices: IndexingService[] = [];

  try {
    // Fetch publication data
    latestIssue = await getLatestIssue();
    featuredArticles = await getFeaturedArticles();

    // Fetch branding and settings
    const journalInfoRef = doc(db, 'settings', 'journalInfo');
    const journalInfoSnap = await getDoc(journalInfoRef);
    if (journalInfoSnap.exists()) {
      const data = journalInfoSnap.data();
      journalInfo = {
        coverLetterUrl: data.coverLetterUrl,
        submissionTemplateUrl: data.submissionTemplateUrl,
      };
    }
    
    const indexingQuery = query(collection(db, 'indexingServices'), orderBy('order'));
    const indexingSnapshot = await getDocs(indexingQuery);
    indexingServices = indexingSnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            name: data.name,
            logoUrl: data.logoUrl,
            order: data.order 
        } as IndexingService;
    });
  } catch (e) {
    console.error("Could not fetch page data", e);
  }

  // Ensure all data is plain serializable objects for Client Components to prevent JSON.parse errors
  const serializableLatestIssue = latestIssue ? JSON.parse(JSON.stringify(latestIssue)) : null;
  const serializableFeaturedArticles = JSON.parse(JSON.stringify(featuredArticles));
  const serializableJournalInfo = JSON.parse(JSON.stringify(journalInfo));
  const serializableIndexingServices = JSON.parse(JSON.stringify(indexingServices));

  return (
    <HomePageClient
      latestIssue={serializableLatestIssue}
      featuredArticles={serializableFeaturedArticles}
      journalInfo={serializableJournalInfo}
      indexingServices={serializableIndexingServices}
    />
  );
}
