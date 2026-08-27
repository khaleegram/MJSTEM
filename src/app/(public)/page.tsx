import { adminDb } from '@/lib/firebase-admin';
import { HomePageClient } from '@/components/home-page-client';
import type { Article, IndexingService } from '@/types';
import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/seo';

// Server-render the homepage so its content is present in the initial HTML
// for search engine crawlers (previously this was fully client-rendered).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'MJSTEM | Multidisciplinary Journal of Science, Technology, Education and Management',
  description:
    'Open-access, peer-reviewed research in science, technology, education, and management. Browse latest articles and submit your manuscript.',
  alternates: { canonical: BASE_URL },
  robots: { index: true, follow: true },
};

async function getFeaturedArticles(): Promise<Article[]> {
  if (!adminDb) return [];
  try {
    const snap = await adminDb
      .collection('submissions')
      .where('status', '==', 'Accepted')
      .orderBy('submittedAt', 'desc')
      .limit(3)
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        contributors: data.contributors,
        manuscriptUrl: data.manuscriptUrl,
        authorName: data.author?.name || '',
        uniqueId: data.uniqueId,
        doi: data.doi,
      } as Article;
    });
  } catch (error) {
    console.error('HomePage: failed to load featured articles', error);
    return [];
  }
}

async function getJournalInfo(): Promise<{ coverLetterUrl?: string; submissionTemplateUrl?: string }> {
  if (!adminDb) return {};
  try {
    const snap = await adminDb.collection('settings').doc('journalInfo').get();
    if (!snap.exists) return {};
    const data = snap.data() || {};
    return {
      coverLetterUrl: data.coverLetterUrl,
      submissionTemplateUrl: data.submissionTemplateUrl,
    };
  } catch (error) {
    console.error('HomePage: failed to load journal info', error);
    return {};
  }
}

async function getIndexingServices(): Promise<IndexingService[]> {
  if (!adminDb) return [];
  try {
    const snap = await adminDb.collection('indexingServices').orderBy('order').get();
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        logoUrl: data.logoUrl,
        order: data.order,
      } as IndexingService;
    });
  } catch (error) {
    console.error('HomePage: failed to load indexing services', error);
    return [];
  }
}

export default async function HomePage() {
  const [featuredArticles, journalInfo, indexingServices] = await Promise.all([
    getFeaturedArticles(),
    getJournalInfo(),
    getIndexingServices(),
  ]);

  return (
    <HomePageClient
      latestIssue={null}
      featuredArticles={featuredArticles}
      journalInfo={journalInfo}
      indexingServices={indexingServices}
    />
  );
}
