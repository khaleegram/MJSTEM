import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const baseUrl = 'https://mjstem.org';

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    '/',
    '/about-journal',
    '/author-guidelines',
    '/archive',
    '/editorial-board',
    '/for-authors',
    '/for-librarians',
    '/for-readers',
    '/ethics-policies',
    '/privacy-policy',
    '/terms-of-service',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  // Dynamic pages for published (Accepted) articles
  const articleRoutes: MetadataRoute.Sitemap = [];
  if (adminDb) {
    try {
      const snapshot = await adminDb
        .collection('submissions')
        .where('status', '==', 'Accepted')
        .get();

      snapshot.forEach((doc) => {
        const data = doc.data();
        articleRoutes.push({
          url: `${baseUrl}/article/${doc.id}`,
          lastModified: toDate(data.submittedAt),
          changeFrequency: 'yearly',
          priority: 0.8,
        });
      });
    } catch (e) {
      console.error('Could not fetch dynamic article routes for sitemap', e);
    }
  }

  return [...staticRoutes, ...articleRoutes];
}
