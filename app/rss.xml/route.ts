import { getPublishedPosts } from '@/lib/blog/loadPosts';
import { absoluteUrl, SITE_NAME } from '@/lib/seo/site';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(date: string): string {
  return new Date(date).toUTCString();
}

function imageEnclosureMimeType(url: string): string | null {
  const path = url.split('?')[0]?.toLowerCase() ?? '';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.gif')) return 'image/gif';
  if (path.endsWith('.png')) return 'image/png';
  return null;
}

function buildEnclosure(coverImage: string): string {
  const url = coverImage.startsWith('http') ? coverImage : absoluteUrl(coverImage);
  const mime = imageEnclosureMimeType(url);
  const typeAttr = mime ? ` type="${mime}"` : '';
  return `<enclosure url="${escapeXml(url)}"${typeAttr} />`;
}

export async function GET() {
  const posts = (await getPublishedPosts()).slice(0, 20);
  const feedUrl = absoluteUrl('/rss.xml');
  const buildDate = toRfc822(new Date().toISOString());

  const items = posts
    .map((post) => {
      const link = absoluteUrl(`/blog/${post.slug}`);
      const pubDate = toRfc822(post.publishedAt);
      const enclosure = post.coverImage ? buildEnclosure(post.coverImage) : '';

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${pubDate}</pubDate>
      ${enclosure}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} Blog</title>
    <link>${escapeXml(absoluteUrl('/blog'))}</link>
    <description>Email signatures, deliverability, and team branding guides from Tailnote.</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
