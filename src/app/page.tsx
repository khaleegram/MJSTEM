
import { PublicHeader } from '@/components/public-header';
import { getLatestIssue, getFeaturedArticles } from '@/services/publication-service';
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { IndexingService } from '@/types';
import { HomePageClient } from '@/components/home-page-client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const latestIssue = await getLatestIssue();
  const featuredArticles = await getFeaturedArticles();
  let journalInfo: { coverLetterUrl?: string, submissionTemplateUrl?: string } = {};
  let branding: { logoUrl?: string } = {};
  let indexingServices: IndexingService[] = [];

  try {
    const journalInfoRef = doc(db, 'settings', 'journalInfo');
    const journalInfoSnap = await getDoc(journalInfoRef);
    if (journalInfoSnap.exists()) {
      journalInfo = journalInfoSnap.data();
    }
    const brandingRef = doc(db, 'settings', 'branding');
    const brandingSnap = await getDoc(brandingRef);
    if (brandingSnap.exists()) {
      branding = brandingSnap.data();
    }
    const indexingQuery = query(collection(db, 'indexingServices'), orderBy('order'));
    const indexingSnapshot = await getDocs(indexingQuery);
    indexingServices = indexingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as IndexingService);
  } catch (e) {
    console.error("Could not fetch page data", e);
  }

  return (
    <HomePageClient
      latestIssue={latestIssue}
      featuredArticles={featuredArticles}
      journalInfo={journalInfo}
      branding={branding}
      indexingServices={indexingServices}
    />
  );
}
