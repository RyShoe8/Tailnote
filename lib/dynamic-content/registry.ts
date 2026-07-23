import { beehiivProvider } from '@/lib/dynamic-content/providers/beehiiv';
import { htmlScanProvider } from '@/lib/dynamic-content/providers/htmlScan';
import { linkAlternateProvider } from '@/lib/dynamic-content/providers/linkAlternate';
import { pathProbeProvider } from '@/lib/dynamic-content/providers/pathProbe';
import { rssFeedProvider } from '@/lib/dynamic-content/providers/rss';
import { substackProvider } from '@/lib/dynamic-content/providers/substack';
import {
  normalizeWebsiteUrl,
  type DetectResult,
  type DynamicContentProvider,
  type FetchResult,
  type ContentSourceLike,
} from '@/lib/dynamic-content/types';
import type { ContentDetectionMethod } from '@/models/ContentSource';

/** Auto-detect order: platforms → common paths → link tags → HTML scan. */
const AUTO_DETECT_PROVIDERS: DynamicContentProvider[] = [
  substackProvider,
  beehiivProvider,
  pathProbeProvider,
  linkAlternateProvider,
  htmlScanProvider,
];

const FETCH_BY_METHOD: Record<string, DynamicContentProvider> = {
  auto_path: pathProbeProvider,
  auto_link: linkAlternateProvider,
  beehiiv: beehiivProvider,
  substack: substackProvider,
  rss_manual: rssFeedProvider,
  html_scan: htmlScanProvider,
  migrated_rss: rssFeedProvider,
};

export async function autoDetectContent(websiteUrl: string): Promise<DetectResult | null> {
  const normalized = normalizeWebsiteUrl(websiteUrl);
  if (!normalized) return null;
  for (const provider of AUTO_DETECT_PROVIDERS) {
    if (!provider.detect) continue;
    try {
      const result = await provider.detect(normalized);
      if (result?.items?.length) return result;
    } catch {
      /* try next provider */
    }
  }
  return null;
}

export async function fetchContentSource(
  source: ContentSourceLike & { detectionMethod?: ContentDetectionMethod | string }
): Promise<FetchResult> {
  const method = source.detectionMethod || (source.feedUrl ? 'rss_manual' : 'auto_path');
  const provider = FETCH_BY_METHOD[method] ?? rssFeedProvider;
  return provider.fetch(source);
}

export async function fetchManualRss(feedUrl: string, source: ContentSourceLike = {}): Promise<FetchResult> {
  return rssFeedProvider.fetch({ ...source, feedUrl });
}

export { AUTO_DETECT_PROVIDERS };
