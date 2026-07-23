import {
  fetchWithConditional,
  normalizeWebsiteUrl,
  type DynamicContentProvider,
  type DetectResult,
} from '@/lib/dynamic-content/types';
import type { ParsedFeedItem } from '@/lib/dynamic-content/parseFeed';

function absoluteUrl(href: string, base: string): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function extractOg(html: string, prop: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const m = re.exec(html);
  if (m) return m[1]!;
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
    'i'
  );
  return re2.exec(html)?.[1] ?? '';
}

/** Best-effort article discovery for sites without RSS. */
export async function scanWebsiteForArticles(
  websiteUrl: string,
  maxItems = 3
): Promise<DetectResult | null> {
  const base = normalizeWebsiteUrl(websiteUrl);
  if (!base) return null;
  try {
    const { res, body } = await fetchWithConditional(base, {
      accept: 'text/html,application/xhtml+xml',
      timeoutMs: 12000,
    });
    if (!res.ok) return null;

    const items: ParsedFeedItem[] = [];
    const seen = new Set<string>();

    const ogTitle = extractOg(body, 'og:title');
    const ogUrl = extractOg(body, 'og:url') || base;
    if (ogTitle && ogUrl) {
      const abs = absoluteUrl(ogUrl, base) || ogUrl;
      seen.add(abs);
      items.push({
        title: ogTitle,
        url: abs,
        guid: abs,
        imageUrl: extractOg(body, 'og:image') || undefined,
      });
    }

    // Collect likely article links from the homepage
    const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(body)) !== null && items.length < maxItems + 4) {
      const href = m[1]!;
      const text = m[2]!.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!text || text.length < 12 || text.length > 180) continue;
      if (/^(home|about|contact|login|sign|privacy|terms|subscribe)/i.test(text)) continue;
      const abs = absoluteUrl(href, base);
      if (!abs || seen.has(abs)) continue;
      if (!abs.startsWith(new URL(base).origin)) continue;
      // Prefer paths that look like posts
      if (!/\/(blog|posts?|articles?|news|stories)\b|\d{4}\/\d{2}/i.test(abs) && items.length >= 1) {
        continue;
      }
      seen.add(abs);
      items.push({ title: text, url: abs, guid: abs });
    }

    const sliced = items.slice(0, maxItems);
    if (!sliced.length) return null;
    return {
      feedUrl: base,
      detectionMethod: 'html_scan',
      items: sliced,
    };
  } catch {
    return null;
  }
}

export const htmlScanProvider: DynamicContentProvider = {
  id: 'html_scan',
  async detect(websiteUrl) {
    return scanWebsiteForArticles(websiteUrl, 3);
  },
  async fetch(source) {
    const detected = await scanWebsiteForArticles(source.websiteUrl || source.feedUrl || '', 5);
    if (!detected) return { kind: 'error', message: 'Could not find articles on website' };
    return {
      kind: 'ok',
      items: detected.items,
      feedUrl: detected.feedUrl,
      detectionMethod: 'html_scan',
    };
  },
};
