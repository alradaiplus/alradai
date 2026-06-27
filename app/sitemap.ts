import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Minimal sitemap for the public entry points (AR root + EN). The notes app
 * itself sits behind auth and is intentionally not listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const alternates = {
    languages: { ar: BASE_URL, en: `${BASE_URL}/en` },
  };

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
      alternates,
    },
    {
      url: `${BASE_URL}/en`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates,
    },
  ];
}
