import { parseRssFeed } from '@/lib/dynamic-content/parseFeed';
import { fetchFeedUrl } from '@/lib/dynamic-content/providers/rss';
import {
  fetchWithConditional,
  normalizeWebsiteUrl,
  type DynamicContentProvider,
} from '@/lib/dynamic-content/types';

function substackFeedCandidates(websiteUrl: string): string[] {
  const base = normalizeWebsiteUrl(websiteUrl);
  if (!base) return [];
  try {
    const u = new URL(base);
    const hosts = [u.hostname];
    if (u.hostname.endsWith('.substack.com')) {
      return [`${u.origin}/feed`];
    }
    // Custom domain or bare newsletter URL — try /feed (Substack custom domains often expose it)
    return [`${u.origin}/feed`, ...hosts.map(() => `${u.origin}/feed`)].slice(0, 1);
  } catch {
    return [];
  }
}

export function looksLikeSubstack(websiteUrl: string): boolean {
  const base = normalizeWebsiteUrl(websiteUrl).toLowerCase();
  return base.includes('substack.com');
}

export const substackProvider: DynamicContentProvider = {
  id: 'substack',
  async detect(websiteUrl) {
    if (!looksLikeSubstack(websiteUrl) && !websiteUrl.toLowerCase().includes('substack')) {
      // Still try /feed on any URL only when hostname suggests substack
      if (!looksLikeSubstack(websiteUrl)) return null;
    }
    for (const feedUrl of substackFeedCandidates(websiteUrl)) {
      try {
        const { res, body } = await fetchWithConditional(feedUrl, { timeoutMs: 8000 });
        if (!res.ok) continue;
        const items = parseRssFeed(body, 5);
        if (items.length) {
          return {
            feedUrl,
            detectionMethod: 'substack',
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
      return fetchFeedUrl(source.feedUrl, source, 'substack');
    }
    const detected = await this.detect?.(source.websiteUrl || '');
    if (!detected) return { kind: 'error', message: 'Substack feed not found' };
    return {
      kind: 'ok',
      items: detected.items,
      etag: detected.etag,
      lastModified: detected.lastModified,
      feedUrl: detected.feedUrl,
      detectionMethod: 'substack',
    };
  },
};
