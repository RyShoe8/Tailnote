import type { MetadataRoute } from 'next';
import { blogSitemapEntries } from '@/lib/blog/loadPosts';
import { marketingSitemapEntries } from '@/lib/seo/marketingPages';
import { warnProductionSiteUrl } from '@/lib/seo/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  warnProductionSiteUrl();
  const blogEntries = await blogSitemapEntries();
  return [...marketingSitemapEntries(), ...blogEntries];
}
