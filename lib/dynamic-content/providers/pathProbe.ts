import { parseRssFeed } from '@/lib/dynamic-content/parseFeed';
import { fetchFeedUrl } from '@/lib/dynamic-content/providers/rss';
import {
  fetchWithConditional,
  normalizeWebsiteUrl,
  type DynamicContentProvider,
} from '@/lib/dynamic-content/types';

const COMMON_PATHS = ['/feed', '/rss', '/rss.xml', '/feed.xml', '/atom.xml'];

export const pathProbeProvider: DynamicContentProvider = {
  id: 'auto_path',
  async detect(websiteUrl) {
    const base = normalizeWebsiteUrl(websiteUrl);
    if (!base) return null;
    for (const path of COMMON_PATHS) {
      try {
        const feedUrl = new URL(path, `${base}/`).href;
        const { res, body } = await fetchWithConditional(feedUrl, { timeoutMs: 8000 });
        if (!res.ok || res.status === 304) continue;
        const items = parseRssFeed(body, 5);
        if (items.length) {
          return {
            feedUrl,
            detectionMethod: 'auto_path',
            items,
            etag: res.headers.get('etag') ?? undefined,
            lastModified: res.headers.get('last-modified') ?? undefined,
          };
        }
      } catch {
        /* try next */
      }
    }
    return null;
  },
  async fetch(source) {
    if (source.feedUrl) {
      return fetchFeedUrl(source.feedUrl, source, 'auto_path');
    }
    const detected = await this.detect?.(source.websiteUrl || '');
    if (!detected) return { kind: 'error', message: 'No feed at common paths' };
    return {
      kind: 'ok',
      items: detected.items,
      etag: detected.etag,
      lastModified: detected.lastModified,
      feedUrl: detected.feedUrl,
      detectionMethod: 'auto_path',
    };
  },
};
