import { isRateLimited } from '@/lib/security/rateLimit';
import { parseRssFeed } from '@/lib/dynamic-content/parseFeed';
import { renderDynamicContentCardPng } from '@/lib/dynamic-content/renderCard';
import { z } from 'zod';
import { renderSignature, type ContentBlockData } from 'emailsignature-engine';
import { presetToEngineTemplate } from '@/lib/email/templatePresets';

const label = z.string().trim().min(1).max(120);
const https = z.string().max(2000).url().regex(/^https:\/\//);
const concept = z.object({
  logoHeightPx: z.number().int().min(24).max(240), email: z.string().email().max(254), feed: z.union([https, z.literal('')]), feedXml: z.string().max(600000),
  company: label, website: https, logo: https, first_name: label, last_name: label, role: label,
  primary_color: z.string().regex(/^#[a-f\d]{6}$/i), secondary_color: z.string().regex(/^#[a-f\d]{6}$/i),
  preset: z.enum(['portfolio', 'creator', 'modern_professional']),
  social: https.regex(/^https:\/\/(?:bsky\.app\/profile\/|(?:www\.)?facebook\.com\/)[a-z\d.\-]+\/?$/i),
  cta_type: z.enum(['book_a_call', 'list']), cta_label: label, cta_url: https,
});

// Stateless rendering with the same engine, layouts and promotional blocks as the editor.
export async function POST(request: Request) {
  if (isRateLimited(request, { windowMs: 60000, max: 20 })) return new Response(null, { status: 429 });
  const raw = await request.text();
  if (raw.length > 750000) return new Response(null, { status: 413 });
  const result = concept.safeParse(await Promise.resolve().then(() => JSON.parse(raw)).catch(() => null));
  if (!result.success) return Response.json({ error: 'Invalid signature concept' }, { status: 400 });
  const c = result.data;
  const posts = parseRssFeed(c.feedXml, 2).filter(item => https.safeParse(item.url).success && item.title.trim());
  if (c.feed && !posts.length) return Response.json({ error: 'No usable published articles in feed' }, { status: 422 });
  const card = c.feed ? await renderDynamicContentCardPng(posts, 1, { primaryColor: c.primary_color, secondaryColor: c.secondary_color }) : null;
  const promo: ContentBlockData[] = card ? [{ type: 'dynamic_content', enabled: true, feedUrl: c.feed, rssItems: posts, contentImageUrl: 'https://tailnote.io/preview-assets/latest-blog.png' }] : [];
  const block: ContentBlockData = c.cta_type === 'book_a_call'
    ? { type: 'book_a_call', enabled: true, callUrl: c.cta_url, callButtonText: c.cta_label, callTitle: c.cta_label }
    : { type: 'list', enabled: true, listTitle: 'Explore', listItems: [{ title: c.cta_label, url: c.cta_url }] };
  const render = (preset: typeof c.preset) => renderSignature({
    profile: { firstName: c.first_name, lastName: c.last_name, title: c.role, email: c.email },
    brand: { companyName: c.company, website: c.website, logoUrl: c.logo, logoHeightPx: c.logoHeightPx, logoLink: c.website, primaryColor: c.primary_color,
      secondaryColor: c.secondary_color, fontFamily: 'Arial', socialLinks: { [c.social.startsWith('https://bsky.app/') ? 'bluesky' : 'facebook']: c.social }, contentBlocks: [...promo, block] },
    template: presetToEngineTemplate(preset, 'outreach-concept'), publicSiteOrigin: 'https://tailnote.io',
  });
  let html = render(c.preset);
  // Some layouts reserve their second promotional slot for links only.
  if (!html.includes(c.cta_url) || (card && !html.includes('latest-blog.png'))) html = render('modern_professional');
  return Response.json({ html, headline: posts[0]?.title ?? '', promoPng: card?.buffer.toString('base64') }, { headers: { 'Cache-Control': 'no-store' } });
}
