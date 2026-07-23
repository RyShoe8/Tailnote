import { parseRssFeed } from '@/lib/dynamic-content/parseFeed';
import {
  fetchWithConditional,
  type ContentSourceLike,
  type DetectResult,
  type DynamicContentProvider,
  type FetchResult,
} from '@/lib/dynamic-content/types';

async function fetchFeedUrl(
  feedUrl: string,
  source: ContentSourceLike,
  detectionMethod: DetectResult['detectionMethod']
): Promise<FetchResult> {
  try {
    const { res, body } = await fetchWithConditional(feedUrl, {
      etag: source.etag,
      lastModified: source.lastModified,
    });
    if (res.status === 304) {
      return {
        kind: 'not_modified',
        etag: source.etag,
        lastModified: source.lastModified,
      };
    }
    if (!res.ok) {
      return { kind: 'error', message: `Feed returned ${res.status}` };
    }
    const items = parseRssFeed(body, 5);
    if (!items.length) {
      return { kind: 'error', message: 'No items found in feed' };
    }
    return {
      kind: 'ok',
      items,
      etag: res.headers.get('etag') ?? undefined,
      lastModified: res.headers.get('last-modified') ?? undefined,
      feedUrl,
      detectionMethod,
    };
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : 'Fetch failed' };
  }
}

export const rssFeedProvider: DynamicContentProvider = {
  id: 'rss',
  async fetch(source) {
    const feedUrl = (source.feedUrl || source.websiteUrl || '').trim();
    if (!feedUrl) return { kind: 'error', message: 'No feed URL' };
    return fetchFeedUrl(feedUrl, source, 'rss_manual');
  },
};

export { fetchFeedUrl };
