
import { MetadataRoute } from 'next';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Submission } from '@/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://mjstem.org'; // IMPORTANT: Replace with your actual domain

  // Static pages
  const staticRoutes = [
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

  // Dynamic pages for published articles
  const articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const articlesQuery = query(collection(db, 'submissions'), where('status', '==', 'Accepted'));
    const articlesSnapshot = await getDocs(articlesQuery);
    articlesSnapshot.forEach((doc) => {
        const submission = { id: doc.id, ...doc.data() } as Submission;
        articleRoutes.push({
            url: `${baseUrl}/article/${submission.id}`, 
            // Use submission date as lastModified, or add a publishedDate field later
            lastModified: submission.submittedAt,
            changeFrequency: 'yearly',
            priority: 0.8
        })
    });
  } catch (e) {
    console.error("Could not fetch dynamic article routes for sitemap", e);
  }
  

  return [...staticRoutes, ...articleRoutes];
}
