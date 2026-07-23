export type ParsedFeedItem = {
  title: string;
  url: string;
  imageUrl?: string;
  pubDate?: string;
  description?: string;
  guid?: string;
};

/**
 * Lightweight RSS/Atom parser — extracts items from XML without external dependencies.
 * Handles both RSS 2.0 (<item>) and Atom (<entry>) feeds.
 */
export function parseRssFeed(xml: string, maxItems = 5): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];

  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null && items.length < maxItems) {
    const block = match[1]!;
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link') || extractAtomLink(block);
    const pubDate = extractTag(block, 'pubDate') || extractTag(block, 'dc:date');
    const guid = extractTag(block, 'guid') || link;
    const description = extractTag(block, 'description') || extractTag(block, 'content:encoded');
    const imageUrl =
      extractMediaContent(block) ||
      extractEnclosure(block) ||
      extractFirstImgSrc(description);
    if (title && link) {
      items.push({
        title: decodeEntities(title),
        url: link.trim(),
        imageUrl: imageUrl || undefined,
        pubDate: pubDate || undefined,
        description: description ? decodeEntities(stripTags(description)).slice(0, 500) : undefined,
        guid: guid ? decodeEntities(guid).trim() : link.trim(),
      });
    }
  }

  if (items.length === 0) {
    const entryRegex = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null && items.length < maxItems) {
      const block = match[1]!;
      const title = extractTag(block, 'title');
      const link = extractAtomLink(block);
      const pubDate = extractTag(block, 'published') || extractTag(block, 'updated');
      const guid = extractTag(block, 'id') || link;
      const description = extractTag(block, 'content') || extractTag(block, 'summary');
      const imageUrl = extractMediaContent(block) || extractFirstImgSrc(description);
      if (title && link) {
        items.push({
          title: decodeEntities(title),
          url: link.trim(),
          imageUrl: imageUrl || undefined,
          pubDate: pubDate || undefined,
          description: description ? decodeEntities(stripTags(description)).slice(0, 500) : undefined,
          guid: guid ? decodeEntities(guid).trim() : link.trim(),
        });
      }
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i');
  const cdataMatch = cdataRe.exec(xml);
  if (cdataMatch) return cdataMatch[1]!.trim();

  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = re.exec(xml);
  return m ? m[1]!.trim() : '';
}

function extractAtomLink(xml: string): string {
  const re = /<link\s[^>]*href="([^"]+)"[^>]*\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const tag = m[0];
    if (!tag.includes('rel=') || tag.includes('rel="alternate"')) {
      return m[1]!;
    }
  }
  const fallback = /<link\s[^>]*href="([^"]+)"[^>]*\/?>/i.exec(xml);
  return fallback ? fallback[1]! : '';
}

function extractMediaContent(xml: string): string {
  const re = /<media:content[^>]+url="([^"]+)"/i;
  const m = re.exec(xml);
  return m ? m[1]! : '';
}

function extractEnclosure(xml: string): string {
  const re = /<enclosure[^>]+url="([^"]+)"[^>]*type="image\//i;
  const m = re.exec(xml);
  return m ? m[1]! : '';
}

function extractFirstImgSrc(html: string): string {
  if (!html) return '';
  const re = /<img[^>]+src="([^"]+)"/i;
  const m = re.exec(html);
  return m ? m[1]! : '';
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

/** Discover RSS/Atom alternate links in HTML. */
export function extractAlternateFeedLinks(html: string, baseUrl: string): string[] {
  const found: string[] = [];
  const re =
    /<link[^>]+rel=["'][^"']*alternate[^"']*["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const type = /type=["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? '';
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href) continue;
    if (
      type.includes('rss') ||
      type.includes('atom') ||
      type.includes('xml') ||
      /feed|rss|atom/i.test(href)
    ) {
      try {
        found.push(new URL(href, baseUrl).href);
      } catch {
        /* skip */
      }
    }
  }
  return [...new Set(found)];
}
