import type { MetadataRoute } from 'next';
import { marketingSitemapEntries } from '@/lib/seo/marketingPages';
import { warnProductionSiteUrl } from '@/lib/seo/site';

export default function sitemap(): MetadataRoute.Sitemap {
  warnProductionSiteUrl();
  return marketingSitemapEntries();
}
