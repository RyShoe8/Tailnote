import { extractAlternateFeedLinks, parseRssFeed } from '@/lib/dynamic-content/parseFeed';
import { fetchFeedUrl } from '@/lib/dynamic-content/providers/rss';
import {
  fetchWithConditional,
  normalizeWebsiteUrl,
  type DynamicContentProvider,
} from '@/lib/dynamic-content/types';

export const linkAlternateProvider: DynamicContentProvider = {
  id: 'auto_link',
  async detect(websiteUrl) {
    const base = normalizeWebsiteUrl(websiteUrl);
    if (!base) return null;
    try {
      const { res, body } = await fetchWithConditional(base, {
        accept: 'text/html,application/xhtml+xml',
        timeoutMs: 10000,
      });
      if (!res.ok) return null;
      const links = extractAlternateFeedLinks(body, base);
      for (const feedUrl of links) {
        const feed = await fetchWithConditional(feedUrl, { timeoutMs: 8000 });
        if (!feed.res.ok) continue;
        const items = parseRssFeed(feed.body, 5);
        if (items.length) {
          return {
            feedUrl,
            detectionMethod: 'auto_link',
            items,
            etag: feed.res.headers.get('etag') ?? undefined,
            lastModified: feed.res.headers.get('last-modified') ?? undefined,
          };
        }
      }
    } catch {
      return null;
    }
    return null;
  },
  async fetch(source) {
    if (source.feedUrl) {
      return fetchFeedUrl(source.feedUrl, source, 'auto_link');
    }
    const detected = await this.detect?.(source.websiteUrl || '');
    if (!detected) return { kind: 'error', message: 'No alternate feed link found' };
    return {
      kind: 'ok',
      items: detected.items,
      etag: detected.etag,
      lastModified: detected.lastModified,
      feedUrl: detected.feedUrl,
      detectionMethod: 'auto_link',
    };
  },
};
