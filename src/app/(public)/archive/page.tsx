import type { Metadata } from 'next';
import { ArchivePageClient } from '@/components/archive-page-client';
import {
  filterUnassignedInPress,
  getArchiveVolumes,
  getArticlesInPress,
} from '@/lib/public-data';
import { BASE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Journal Archives | MJSTEM',
  description:
    'Browse published volumes, issues, and articles in press from the Maiduguri Journal of STEM (MJSTEM).',
  alternates: { canonical: `${BASE_URL}/archive` },
  robots: { index: true, follow: true },
};

export default async function ArchivePage() {
  const [volumes, inPressArticles] = await Promise.all([
    getArchiveVolumes(),
    getArticlesInPress(),
  ]);

  const filteredInPress = filterUnassignedInPress(volumes, inPressArticles);

  return <ArchivePageClient volumes={volumes} inPressArticles={filteredInPress} />;
}
