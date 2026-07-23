import { parseRssFeed } from '@/lib/dynamic-content/parseFeed';
import { fetchFeedUrl } from '@/lib/dynamic-content/providers/rss';
import {
  fetchWithConditional,
  normalizeWebsiteUrl,
  type DynamicContentProvider,
} from '@/lib/dynamic-content/types';

export function looksLikeBeehiiv(websiteUrl: string): boolean {
  const u = normalizeWebsiteUrl(websiteUrl).toLowerCase();
  return u.includes('beehiiv.com') || u.includes('beehiiv.');
}

function beehiivFeedCandidates(websiteUrl: string): string[] {
  const base = normalizeWebsiteUrl(websiteUrl);
  if (!base) return [];
  try {
    const u = new URL(base);
    // Beehiiv publications commonly expose /feed
    return [`${u.origin}/feed`, `${u.origin}/rss`];
  } catch {
    return [];
  }
}

export const beehiivProvider: DynamicContentProvider = {
  id: 'beehiiv',
  async detect(websiteUrl) {
    if (!looksLikeBeehiiv(websiteUrl)) return null;
    for (const feedUrl of beehiivFeedCandidates(websiteUrl)) {
      try {
        const { res, body } = await fetchWithConditional(feedUrl, { timeoutMs: 8000 });
        if (!res.ok) continue;
        const items = parseRssFeed(body, 5);
        if (items.length) {
          return {
            feedUrl,
            detectionMethod: 'beehiiv',
            items,
            etag: res.headers.get('etag') ?? undefined,
            lastModified: res.headers.get('last-modified') ?? undefined,
          };
        }
      } catch {
        /* next */
      }
    }
    return null;
  },
  async fetch(source) {
    if (source.feedUrl) {
      return fetchFeedUrl(source.feedUrl, source, 'beehiiv');
    }
    const detected = await this.detect?.(source.websiteUrl || '');
    if (!detected) return { kind: 'error', message: 'Beehiiv feed not found' };
    return {
      kind: 'ok',
      items: detected.items,
      etag: detected.etag,
      lastModified: detected.lastModified,
      feedUrl: detected.feedUrl,
      detectionMethod: 'beehiiv',
    };
  },
};
