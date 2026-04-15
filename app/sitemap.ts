import type { MetadataRoute } from 'next';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pyb3dcp.com';

/**
 * Generates a bilingual sitemap for AR (root) + EN (/en) versions.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    // Arabic root (canonical)
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
      alternates: {
        languages: {
          ar: BASE_URL,
          en: `${BASE_URL}/en`,
        },
      },
    },
    // English
    {
      url: `${BASE_URL}/en`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          ar: BASE_URL,
          en: `${BASE_URL}/en`,
        },
      },
    },
  ];

  return routes;
}
