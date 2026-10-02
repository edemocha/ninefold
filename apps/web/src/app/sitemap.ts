import type { MetadataRoute } from 'next';
import { ALL_VALUES, PAIR_SLUGS, SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

/** Only pages that carry no personal data. The reading screens only exist in a visitor's memory. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/',
    '/numbers',
    ...ALL_VALUES.map((n) => `/numbers/${n}`),
    '/between',
    ...PAIR_SLUGS.map((slug) => `/between/${slug}`),
    '/method',
    '/privacy',
    '/terms',
  ];
  return paths.map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: 'monthly', priority: path === '/' ? 1 : 0.6 }));
}
