import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return [
    { url: `${base}/simple`, changeFrequency: 'monthly', priority: 1 },
    { url: base, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
