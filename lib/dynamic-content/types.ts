import type { ContentDetectionMethod } from '@/models/ContentSource';
import type { ParsedFeedItem } from '@/lib/dynamic-content/parseFeed';

export type DetectResult = {
  feedUrl: string;
  detectionMethod: ContentDetectionMethod;
  items: ParsedFeedItem[];
  etag?: string;
  lastModified?: string;
};

export type FetchResult =
  | { kind: 'not_modified'; etag?: string; lastModified?: string }
  | {
      kind: 'ok';
      items: ParsedFeedItem[];
      etag?: string;
      lastModified?: string;
      feedUrl?: string;
      detectionMethod?: ContentDetectionMethod;
    }
  | { kind: 'error'; message: string };

export type ContentSourceLike = {
  websiteUrl?: string;
  feedUrl?: string;
  etag?: string;
  lastModified?: string;
};

export type DynamicContentProvider = {
  id: string;
  /** Optional auto-detect from a website URL. */
  detect?(websiteUrl: string): Promise<DetectResult | null>;
  fetch(source: ContentSourceLike): Promise<FetchResult>;
};

export const FEED_USER_AGENT = 'Tailnote/1.0 Dynamic Content';
export const FEED_ACCEPT =
  'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8';

export async function fetchWithConditional(
  url: string,
  opts?: { etag?: string; lastModified?: string; timeoutMs?: number; accept?: string }
): Promise<{ res: Response; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 12000);
  try {
    const headers: Record<string, string> = {
      'User-Agent': FEED_USER_AGENT,
      Accept: opts?.accept ?? FEED_ACCEPT,
    };
    if (opts?.etag) headers['If-None-Match'] = opts.etag;
    if (opts?.lastModified) headers['If-Modified-Since'] = opts.lastModified;

    const res = await fetch(url, { signal: controller.signal, headers });
    if (res.status === 304) {
      return { res, body: '' };
    }
    const body = await res.text();
    return { res, body };
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeWebsiteUrl(input: string): string {
  const t = input.trim();
  if (!t) return '';
  try {
    const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    const u = new URL(withScheme);
    u.hash = '';
    return u.href.replace(/\/$/, '') || u.origin;
  } catch {
    return '';
  }
}
