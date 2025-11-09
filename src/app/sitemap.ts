import { MetadataRoute } from 'next';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Volume } from '@/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://mjstem.org'; // IMPORTANT: Replace with your actual domain

  // Static pages
  const staticRoutes = [
    '/',
    '/aims-scope',
    '/author-guidelines',
    '/archive',
    '/editorial-board',
    '/for-authors',
    '/for-librarians',
    '/for-readers',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  // Dynamic pages (e.g., published volumes/articles)
  // This is a simplified example. You might want to get individual articles too.
  const dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const volsQuery = query(collection(db, 'volumes'), orderBy('year', 'desc'));
    const volsSnapshot = await getDocs(volsQuery);
    volsSnapshot.forEach((doc) => {
        const volume = doc.data() as Volume;
        // You could add a lastModified field to your volumes, otherwise use current date
        dynamicRoutes.push({
            url: `${baseUrl}/archive`, // All volumes are on the archive page
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8
        })
    });
  } catch (e) {
    console.error("Could not fetch dynamic routes for sitemap", e);
  }
  

  return [...staticRoutes, ...dynamicRoutes];
}
