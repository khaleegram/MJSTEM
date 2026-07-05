import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.mjstem.org';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/login', '/signup', '/dashboard/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
