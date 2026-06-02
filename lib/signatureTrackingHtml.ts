import { load } from 'cheerio';
import { mergeRenderContext, type RenderSignatureInput } from 'emailsignature-engine';
import type { OrganizationDoc } from '@/models/Organization';
import type { SignatureClickKind } from '@/models/SignatureClickEvent';
import { createSignatureTrackingToken } from '@/lib/signatureTrackingToken';
import { createSignatureOpenToken } from '@/lib/signatureOpenToken';
import { getSignatureTrackingSecret } from '@/lib/signatureTrackingSecret';
import { normalizePromoUrl } from '@/lib/urls/normalizePromoUrl';
import { hasAnalytics } from 'billing-engine';

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripTrailingSlash(u: string): string {
  return u.replace(/\/+$/, '');
}

function normalizeHref(raw: string): string {
  const t = decodeHtmlEntities(raw).trim();
  if (!t) return '';
  if (/^mailto:/i.test(t)) return t;
  if (/^tel:/i.test(t)) return t.replace(/\s/g, '');
  try {
    return new URL(t).href;
  } catch {
    return t;
  }
}

/** Strip known marketing query params so rendered links match contentBlockUrlMap after appendUtmParams. */
function stripMarketingParams(decodedHttpHref: string): string {
  const t = decodedHttpHref.trim();
  if (!/^https?:\/\//i.test(t)) return t;
  try {
    const u = new URL(t);
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const) {
      u.searchParams.delete(k);
    }
    return u.toString();
  } catch {
    return t;
  }
}

function normalizeHrefWithoutMarketing(rawHref: string): string {
  return normalizeHref(stripMarketingParams(decodeHtmlEntities(rawHref)));
}

function classifyAnchor(
  hrefRaw: string,
  hasImg: boolean,
  ctx: {
    socialByHref: Map<string, SignatureClickKind>;
    logoHrefNorm: string;
    mailtoNorm: string;
    officeTelNorm: string;
    mobileTelNorm: string;
    websiteNorm: string;
    contentBlockUrlMap: Map<string, SignatureClickKind>;
  }
): SignatureClickKind | null {
  const h = normalizeHref(hrefRaw);
  const hNoMarketing = normalizeHrefWithoutMarketing(hrefRaw);
  if (!h) return null;
  if (h.includes('/api/vcard/') || hNoMarketing.includes('/api/vcard/')) {
    return 'save_contact';
  }
  if (hasImg) {
    const sk = ctx.socialByHref.get(h) ?? ctx.socialByHref.get(hNoMarketing);
    if (sk) return sk;
    if (ctx.logoHrefNorm && (h === ctx.logoHrefNorm || hNoMarketing === ctx.logoHrefNorm)) return 'logo';
    return null;
  }
  if (ctx.mailtoNorm && h === ctx.mailtoNorm) return 'email';
  if (ctx.officeTelNorm && h === ctx.officeTelNorm) return 'office_phone';
  if (ctx.mobileTelNorm && h === ctx.mobileTelNorm) return 'mobile_phone';
  if (ctx.websiteNorm && (h === ctx.websiteNorm || hNoMarketing === ctx.websiteNorm)) return 'website';

  const cbKind = ctx.contentBlockUrlMap.get(h) ?? ctx.contentBlockUrlMap.get(hNoMarketing);
  if (cbKind) return cbKind;

  return null;
}

function buildClassificationContext(input: RenderSignatureInput) {
  const origin = stripTrailingSlash(
    (input.publicSiteOrigin ?? 'http://localhost:3000').trim() || 'http://localhost:3000'
  );
  const { stringCtx } = mergeRenderContext(input.profile, input.brand, input.template, origin);
  const dec = decodeHtmlEntities;

  const socialByHref = new Map<string, SignatureClickKind>();
  for (const [val, kind] of [
    [stringCtx.linkedin, 'social_linkedin'],
    [stringCtx.facebook, 'social_facebook'],
    [stringCtx.instagram, 'social_instagram'],
    [stringCtx.reddit, 'social_reddit'],
    [stringCtx.discord, 'social_discord'],
  ] as const) {
    const v = dec(val);
    if (v) socialByHref.set(normalizeHref(v), kind);
  }

  const logoHrefNorm = stringCtx.logoLink ? normalizeHref(dec(stringCtx.logoLink)) : '';
  const mailtoNorm = stringCtx.email ? normalizeHref(`mailto:${dec(stringCtx.email)}`) : '';
  const officeTelNorm = stringCtx.officePhoneTelHref ? normalizeHref(dec(stringCtx.officePhoneTelHref)) : '';
  const mobileTelNorm = stringCtx.mobilePhoneTelHref ? normalizeHref(dec(stringCtx.mobilePhoneTelHref)) : '';
  const websiteNorm = stringCtx.website ? normalizeHref(dec(stringCtx.website)) : '';

  const contentBlockUrlMap = new Map<string, SignatureClickKind>();
  if (input.brand.contentBlocks) {
    input.brand.contentBlocks.forEach((block, index) => {
      if (!block.enabled) return;
      const kind = index === 0 ? 'content_block_1' : 'content_block_2';
      if (block.type === 'book_a_call' && block.callUrl) {
        const h = normalizeHref(block.callUrl);
        if (h) contentBlockUrlMap.set(h, kind);
      } else if (block.type === 'latest_blogs' && block.rssItems) {
        block.rssItems.forEach(item => {
          const h = normalizeHref(item.url);
          if (h) contentBlockUrlMap.set(h, kind);
        });
      } else if (block.type === 'custom' && block.customUrl) {
        const h = normalizeHref(block.customUrl);
        if (h) contentBlockUrlMap.set(h, kind);
      } else if (block.type === 'list' && block.listItems) {
        for (const it of block.listItems) {
          const raw = it.url?.trim();
          if (!raw) continue;
          const absolute = normalizePromoUrl(raw, it.urlPrefix === 'www' ? 'www' : 'https');
          const h = normalizeHref(absolute);
          if (h) contentBlockUrlMap.set(h, kind);
        }
      } else if (block.type === 'image' && block.imageLinkUrl) {
        const h = normalizeHref(block.imageLinkUrl);
        if (h) contentBlockUrlMap.set(h, kind);
      }
    });
  }

  return { socialByHref, logoHrefNorm, mailtoNorm, officeTelNorm, mobileTelNorm, websiteNorm, contentBlockUrlMap };
}

/**
 * Rewrites trackable `<a href>` values to signed `/api/track/signature` URLs.
 * Caller must pass organizationId (and optional employeeId) for attribution.
 */
export function appendSignatureClickTracking(args: {
  html: string;
  organizationId: string;
  employeeId?: string;
  input: RenderSignatureInput;
  baseUrl: string;
}): string {
  const secret = getSignatureTrackingSecret();
  if (!secret || !args.html.trim()) return args.html;

  const ctx = buildClassificationContext(args.input);
  const root = stripTrailingSlash(args.baseUrl.trim());
  const $ = load(args.html, null, false);

  $('a[href]').each((_, el) => {
    const $a = $(el);
    const rawHref = $a.attr('href');
    if (!rawHref || rawHref.startsWith('#')) return;
    const hasImg = $a.find('img').length > 0;
    const kind = classifyAnchor(rawHref, hasImg, ctx);
    if (!kind) return;
    const destination = decodeHtmlEntities(rawHref).trim();
    if (!destination) return;
    let token: string;
    try {
      token = createSignatureTrackingToken(
        {
          organizationId: args.organizationId,
          employeeId: args.employeeId,
          kind,
          destination,
        },
        secret
      );
    } catch {
      return;
    }
    const trackUrl = `${root}/api/track/signature?t=${encodeURIComponent(token)}`;
    $a.attr('href', trackUrl);
  });

  return $.html();
}

export function appendSignatureClickTrackingIfEnabled(args: {
  html: string;
  org: OrganizationDoc & { signatureClickTrackingEnabled?: boolean };
  organizationId: string;
  employeeId?: string;
  input: RenderSignatureInput;
  baseUrl: string;
}): string {
  if (!hasAnalytics(args.org)) return args.html;
  if (!args.org.signatureClickTrackingEnabled) return args.html;
  if (!getSignatureTrackingSecret()) return args.html;
  return appendSignatureClickTracking({
    html: args.html,
    organizationId: args.organizationId,
    employeeId: args.employeeId,
    input: args.input,
    baseUrl: args.baseUrl,
  });
}

export function generateSignatureLink(args: {
  org: Pick<OrganizationDoc, 'plan' | 'subscriptionStatus'> & { signatureClickTrackingEnabled?: boolean };
  organizationId: string;
  employeeId?: string;
  kind: SignatureClickKind;
  destination: string;
  baseUrl: string;
}): string {
  const fallback = decodeHtmlEntities(args.destination).trim();
  if (!fallback) return '';
  if (!hasAnalytics(args.org) || !args.org.signatureClickTrackingEnabled) return fallback;
  const secret = getSignatureTrackingSecret();
  if (!secret) return fallback;
  try {
    const token = createSignatureTrackingToken(
      {
        organizationId: args.organizationId,
        employeeId: args.employeeId,
        kind: args.kind,
        destination: fallback,
      },
      secret
    );
    const root = stripTrailingSlash(args.baseUrl.trim());
    return `${root}/api/track/signature?t=${encodeURIComponent(token)}`;
  } catch {
    return fallback;
  }
}

export function appendSignatureOpenTrackingPixelIfEnabled(args: {
  html: string;
  org: OrganizationDoc & { signatureOpenTrackingEnabled?: boolean };
  organizationId: string;
  employeeId?: string;
  baseUrl: string;
}): string {
  if (!hasAnalytics(args.org)) return args.html;
  if (!args.org.signatureOpenTrackingEnabled || !args.html.trim()) return args.html;
  const secret = getSignatureTrackingSecret();
  if (!secret) return args.html;

  let token: string;
  try {
    token = createSignatureOpenToken(
      { organizationId: args.organizationId, employeeId: args.employeeId },
      secret
    );
  } catch {
    return args.html;
  }

  const root = stripTrailingSlash(args.baseUrl.trim());
  const trackUrl = `${root}/api/track/signature/open?t=${encodeURIComponent(token)}`;
  const pixel = `<img src="${trackUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;
  return `${args.html}${pixel}`;
}
