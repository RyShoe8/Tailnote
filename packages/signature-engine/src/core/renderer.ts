import type {
  RenderSignatureInput,
  SignatureBrand,
  SignatureProfile,
  SignatureTemplate,
  SignatureElement,
  ContentBlockData,
} from './types';
import { STANDARD_SIGNATURE_TEMPLATE } from './templates/standard';
import { STACKED_SIGNATURE_TEMPLATE } from './templates/stacked';
import { CORPORATE_SIGNATURE_TEMPLATE } from './templates/corporate';
import { PROFESSIONAL_SIGNATURE_TEMPLATE } from './templates/professional';
import { DEFAULT_SIGNATURE_TEMPLATE } from './templates/default';
import { CREATOR_SIGNATURE_TEMPLATE } from './templates/creator';
import { EXECUTIVE_MINIMALIST_SIGNATURE_TEMPLATE } from './templates/executive_minimalist';
import { PORTFOLIO_SIGNATURE_TEMPLATE } from './templates/portfolio';
import { ECARD_SIGNATURE_TEMPLATE } from './templates/ecard';
import { MODERN_PROFESSIONAL_SIGNATURE_TEMPLATE } from './templates/modern_professional';
import { normalizePromoUrl } from './normalizePromoUrl';
import { adjustHexLightness } from './colorUtils';
import {
  buildMpMiddleColumnHtml,
  buildOrderedMainStackHtml,
  buildCreatorContactTableHtmlOrdered,
  buildExecutiveContactLineHtmlOrdered,
  buildPortfolioContactPillsHtmlOrdered,
  buildEcardContactTableHtmlOrdered,
  type OrderedContactBuildInput,
} from './orderedContactHtml';
import {
  SOCIAL_ICON_BLUESKY,
  SOCIAL_ICON_DISCORD,
  SOCIAL_ICON_FACEBOOK,
  SOCIAL_ICON_INSTAGRAM,
  SOCIAL_ICON_LINKEDIN,
  SOCIAL_ICON_REDDIT,
  SOCIAL_ICON_YOUTUBE,
  SOCIAL_ICON_GLOBE,
} from './socialIcons';

type ElementType = SignatureElement['type'];

function hasElement(elements: SignatureElement[], type: ElementType): boolean {
  return elements.some((e) => e.type === type);
}

function logoWidthForLayout(layout: SignatureTemplate['layout'], useCircle: boolean): string {
  if (layout === 'portfolio') return '85';
  if (layout === 'ecard') return '80';
  if (useCircle) return '110';
  switch (layout) {
    case 'default':
      return '130';
    case 'standard':
    case 'stacked':
      return '110';
    case 'creator':
      return '100';
    case 'executive_minimalist':
      return '90';
    case 'professional':
      return '105';
    default:
      return '100';
  }
}

/** Width used when persisting org.logoHeightPx after upload (see logoHeightPxForEmailDisplay). */
export const LOGO_HEIGHT_REFERENCE_WIDTH_PX = 110;

/** Outlook and most clients need explicit img height; GIF logos may use height:auto. */
export function resolveLogoDisplayHeight(
  logoWidthPx: number,
  explicitLogoHeightPx: number | undefined,
  useAnimatedGif: boolean,
  referenceLogoWidthPx: number = LOGO_HEIGHT_REFERENCE_WIDTH_PX
): { displayHeight: string; useAutoHeight: boolean } {
  if (useAnimatedGif && (!explicitLogoHeightPx || explicitLogoHeightPx <= 0)) {
    return { displayHeight: '', useAutoHeight: true };
  }
  let h: number;
  if (
    typeof explicitLogoHeightPx === 'number' &&
    Number.isFinite(explicitLogoHeightPx) &&
    explicitLogoHeightPx > 0 &&
    explicitLogoHeightPx <= 400
  ) {
    const refW = referenceLogoWidthPx > 0 ? referenceLogoWidthPx : LOGO_HEIGHT_REFERENCE_WIDTH_PX;
    h = Math.round(explicitLogoHeightPx * (logoWidthPx / refW));
  } else {
    h = Math.min(120, Math.max(24, Math.round(logoWidthPx * 0.45)));
  }
  h = Math.min(400, Math.max(24, h));
  return { displayHeight: String(h), useAutoHeight: false };
}

function logoImgBorderRadiusForLayout(
  layout: SignatureTemplate['layout'],
  useCircle: boolean
): string {
  if (useCircle) return '50%';
  switch (layout) {
    case 'professional':
      return '8px';
    case 'creator':
      return '4px';
    default:
      return '0';
  }
}

/** Fallback when publicSiteOrigin is not passed (local dev). Set NEXT_PUBLIC_SITE_URL in production. */
const DEFAULT_PUBLIC_SITE_ORIGIN = 'http://localhost:3000';

function stripTrailingSlash(u: string): string {
  return u.replace(/\/+$/, '');
}

/**
 * Unwraps Next.js portfolio image proxy URLs so pasted email HTML loads images directly.
 */
export function unwrapImageProxyUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  try {
    if (/^https?:\/\//i.test(t)) {
      const u = new URL(t);
      if (u.pathname.includes('/api/image-proxy')) {
        const inner = u.searchParams.get('url');
        if (inner) return decodeURIComponent(inner);
      }
      return t;
    }
    if (t.startsWith('/api/image-proxy')) {
      const q = t.indexOf('?');
      if (q === -1) return t;
      const params = new URLSearchParams(t.slice(q + 1));
      const inner = params.get('url');
      if (inner) return decodeURIComponent(inner);
    }
    return t;
  } catch {
    return t;
  }
}

/**
 * Resolves relative and protocol-relative URLs to absolute https for email clients.
 */
export function ensureAbsolutePublicUrl(raw: string, origin: string): string {
  const base = stripTrailingSlash(origin.trim() || DEFAULT_PUBLIC_SITE_ORIGIN);
  const t = unwrapImageProxyUrl(raw).trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('//')) return `https:${t}`;
  if (t.startsWith('/')) return `${base}${t}`;
  return t;
}

function normalizeWebsite(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function normalizeImageUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (!/^https?:\/\//i.test(t)) return t.replace(/ /g, '%20');

  try {
    const url = new URL(t);
    const normalizedPath = url.pathname
      .split('/')
      .map((segment) => {
        if (!segment) return segment;
        try {
          return encodeURIComponent(decodeURIComponent(segment));
        } catch {
          return encodeURIComponent(segment);
        }
      })
      .join('/');
    url.pathname = normalizedPath;
    return url.toString();
  } catch {
    return t.replace(/ /g, '%20');
  }
}

function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : `tel:${phone.trim()}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Link label when a list row has a URL but no title (hostname, else "Link"). */
function listItemLinkFallbackLabel(rawUrl: string): string {
  const t = rawUrl.trim();
  if (!t) return 'Link';
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    return u.hostname.replace(/^www\./i, '');
  } catch {
    return 'Link';
  }
}

function listItemHasBody(it: {
  title?: string;
  description?: string;
  url?: string;
}): boolean {
  return Boolean(
    (it.title || '').trim() || (it.description || '').trim() || (it.url || '').trim()
  );
}

function isTruthy(ctx: Record<string, string | boolean | undefined>, key: string): boolean {
  const v = ctx[key];
  if (v === undefined || v === null || v === false) return false;
  if (typeof v === 'string') return v.trim() !== '';
  return Boolean(v);
}

/**
 * Resolves {{#if key}}...{{/if}} with optional nesting.
 */
function processConditionals(
  template: string,
  evalCtx: Record<string, string | boolean | undefined>
): string {
  const openRe = /\{\{#if\s+([\w]+)\s*\}\}/;
  let result = template;
  let match = openRe.exec(result);
  while (match) {
    const key = match[1];
    const start = match.index;
    const openEnd = start + match[0].length;
    let depth = 1;
    let i = openEnd;
    let closeStart = -1;
    while (i < result.length && depth > 0) {
      const nextIf = result.indexOf('{{#if', i);
      const nextFi = result.indexOf('{{/if}}', i);
      if (nextFi === -1) break;
      if (nextIf !== -1 && nextIf < nextFi) {
        depth += 1;
        const innerOpen = result.slice(nextIf).match(/^\{\{#if\s+[\w]+\s*\}\}/);
        i = nextIf + (innerOpen?.[0].length ?? 5);
      } else {
        depth -= 1;
        if (depth === 0) {
          closeStart = nextFi;
          break;
        }
        i = nextFi + 8;
      }
    }
    if (closeStart === -1) break;
    const closeEnd = closeStart + '{{/if}}'.length;
    const inner = result.slice(openEnd, closeStart);
    const keep = isTruthy(evalCtx, key);
    const replacement = keep ? processConditionals(inner, evalCtx) : '';
    result = result.slice(0, start) + replacement + result.slice(closeEnd);
    match = openRe.exec(result);
  }
  return result;
}

function substituteVariables(html: string, strings: Record<string, string>): string {
  return html.replace(/\{\{([\w]+)\}\}/g, (_, key: string) => {
    const v = strings[key];
    return v !== undefined ? v : '';
  });
}

function quoteFontSizePx(size: ContentBlockData['quoteFontSize']): string {
  switch (size) {
    case 'small':
      return '11px';
    case 'large':
      return '15px';
    default:
      return '13px';
  }
}

function quoteAttributionFontSizePx(size: ContentBlockData['quoteFontSize']): string {
  switch (size) {
    case 'small':
      return '10px';
    case 'large':
      return '12px';
    default:
      return '11px';
  }
}

function buildQuoteBlockHtml(block: ContentBlockData, primaryColor: string, isDark: boolean = false): string {
  if (block.type !== 'quote') return '';
  const text = (block.quoteResolvedText ?? block.quoteText ?? '').trim();
  if (!text) return '';

  const showAttribution = block.quoteShowAttribution !== false;
  const attribution = (block.quoteResolvedAttribution ?? block.quoteAttribution ?? '').trim();
  const sourceUrl = (block.quoteResolvedSourceUrl ?? '').trim();
  const align = block.quoteAlignment === 'center' ? 'center' : 'left';
  const fontSize = quoteFontSizePx(block.quoteFontSize);
  const attrSize = quoteAttributionFontSizePx(block.quoteFontSize);
  const style = block.quoteStyle ?? 'standard';
  const accent = escapeHtml(primaryColor.trim() || '#333333');
  
  const textColor = isDark ? '#F3F4F6' : '#333333';
  const mutedColor = isDark ? '#9CA3AF' : '#666666';

  let cellStyle = `font-size:${fontSize};font-style:italic;color:${textColor};line-height:1.5;padding:0;text-align:${align};`;
  let tableStyle = 'border-collapse:collapse;margin-bottom:12px;';

  if (style === 'standard') {
    cellStyle += `border-left:3px solid ${accent};padding-left:10px;`;
  } else if (style === 'highlighted') {
    tableStyle += `background-color:${isDark ? '#374151' : '#f5f5f5'};`;
    cellStyle += 'padding:10px 12px;';
  }

  const quoteText = escapeHtml(text);
  let attributionRow = '';
  if (showAttribution && attribution) {
    const attrEscaped = escapeHtml(attribution);
    const attrInner = sourceUrl
      ? `&mdash; <a href="${escapeHtml(sourceUrl)}" style="color:${mutedColor};text-decoration:none;">${attrEscaped}</a>`
      : `&mdash; ${attrEscaped}`;
    attributionRow = `<tr><td style="font-size:${attrSize};color:${mutedColor};margin-top:6px;text-align:${align};font-style:normal;padding-top:6px;">${attrInner}</td></tr>`;
  }

  return `<table cellpadding="0" cellspacing="0" border="0" style="${tableStyle}" width="100%">
  <tr><td style="${cellStyle}">&ldquo;${quoteText}&rdquo;</td></tr>
  ${attributionRow}
</table>`;
}

function buildQuoteBlocksHtml(blocks: ContentBlockData[], primaryColor: string, isDark: boolean = false): string {
  const enabled = blocks.filter((b) => b.enabled && b.type === 'quote').slice(0, 2);
  if (enabled.length === 0) return '';
  return enabled.map((b) => buildQuoteBlockHtml(b, primaryColor, isDark)).join('');
}

function buildContentBlockParts(
  blocks: ContentBlockData[],
  origin: string,
  primaryColor: string,
  activeSpotlight?: RenderSignatureInput['activeSpotlight']
): string[] {
  const btnBg = escapeHtml(primaryColor);
  const enabled = blocks.filter((b) => b.enabled).slice(0, 2);
  if (enabled.length === 0) return [];

  const parts: string[] = [];

  for (const block of enabled) {
    if (block.type === 'book_a_call') {
      const title = escapeHtml((block.callTitle || 'Book a Call').trim());
      const url = escapeHtml((block.callUrl || '#').trim());
      const btnText = escapeHtml((block.callButtonText || 'Schedule Now').trim());
      parts.push(`<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:12px;" width="100%">
  <tr><td style="font-size:12px;font-weight:700;color:#333;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${title}</td></tr>
  <tr><td style="padding:0;">
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
      <tr>
        <td align="center" valign="middle" bgcolor="${btnBg}" style="background-color:${btnBg};border-radius:4px;padding:8px 18px;">
          <a href="${url}" style="color:#ffffff;font-size:12px;font-weight:600;text-decoration:none;display:inline-block;line-height:1.3;">${btnText}</a>
        </td>
      </tr>
    </table>
  </td></tr>
</table>`);
    } else if (block.type === 'latest_blogs') {
      const items = (block.rssItems || []).slice(0, 3);
      if (items.length === 0) continue;
      let itemsHtml = '';
      for (const item of items) {
        const itemTitle = escapeHtml((item.title || '').trim());
        const itemUrl = escapeHtml((item.url || '#').trim());
        itemsHtml += `<tr><td style="padding:0 0 6px 0;font-size:12px;line-height:1.4;">
  <a href="${itemUrl}" style="color:#333;text-decoration:none;font-weight:500;">${itemTitle}</a>
</td></tr>`;
      }
      parts.push(`<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:12px;" width="100%">
  <tr><td style="font-size:12px;font-weight:700;color:#333;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">Latest Posts</td></tr>
  ${itemsHtml}
</table>`);
    } else if (block.type === 'list') {
      const title = escapeHtml((block.listTitle || '').trim());
      const items = (block.listItems || []).filter(listItemHasBody).slice(0, 4);
      if (!title && items.length === 0) continue;
      let inner = '';
      if (title) {
        inner += `<tr><td style="font-size:12px;font-weight:700;color:#333;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${title}</td></tr>`;
      }
      for (const item of items) {
        const titleTrim = (item.title || '').trim();
        const itemDesc = item.description ? escapeHtml(item.description.trim()) : '';
        const itemUrl = item.url
        ? normalizePromoUrl(item.url, item.urlPrefix === 'www' ? 'www' : 'https')
        : '';
        const boldLabelRaw =
          titleTrim || (itemUrl ? listItemLinkFallbackLabel(itemUrl) : '');
        const boldEscaped = escapeHtml(boldLabelRaw);
        let titleHtml = '';
        if (itemUrl && boldLabelRaw) {
          titleHtml = `<a href="${escapeHtml(itemUrl)}" style="color:#333;text-decoration:none;font-weight:600;">${boldEscaped}</a>`;
        } else if (boldLabelRaw) {
          titleHtml = `<span style="color:#333;font-weight:600;">${boldEscaped}</span>`;
        }
        const descHtml = itemDesc
          ? `<div style="color:#666;font-size:11px;line-height:1.4;margin-top:2px;">${itemDesc}</div>`
          : '';
        if (!titleHtml && !descHtml) continue;
        inner += `<tr><td style="padding:0 0 6px 0;font-size:12px;line-height:1.4;">${titleHtml}${descHtml}</td></tr>`;
      }
      parts.push(`<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:12px;" width="100%">${inner}</table>`);
    } else if (block.type === 'image') {
      const imageUrl = (block.imageUrl || '').trim();
      if (!imageUrl) continue;
      const absImg = escapeHtml(ensureAbsolutePublicUrl(normalizeImageUrl(imageUrl), origin));
      const linkUrl = (block.imageLinkUrl || '').trim();
      const imgTag = `<img src="${absImg}" width="200" border="0" alt="" style="display:block;max-width:200px;width:200px;height:auto;border:0;outline:none;text-decoration:none;border-radius:4px;" />`;
      const wrapped = linkUrl
        ? `<a href="${escapeHtml(linkUrl)}" style="text-decoration:none;border:0;outline:none;display:inline-block;">${imgTag}</a>`
        : imgTag;
      parts.push(`<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:12px;" width="100%">
  <tr><td style="padding:0;line-height:0;font-size:0;">${wrapped}</td></tr>
</table>`);
    } else if (block.type === 'custom') {
      // Legacy fallback: render saved `custom` blocks so existing data keeps working.
      // We deliberately skip the old "Learn more ->" trailing row; if the block has a URL
      // and no image, the title itself becomes the link.
      const rawTitle = (block.customTitle || '').trim();
      const title = escapeHtml(rawTitle);
      const text = escapeHtml((block.customText || '').trim());
      const url = block.customUrl?.trim() || '';
      const imageUrl = block.customImageUrl?.trim() || '';
      let html = '';
      if (title) {
        const titleInner =
          url && !imageUrl
            ? `<a href="${escapeHtml(url)}" style="color:#333;text-decoration:none;">${title}</a>`
            : title;
        html += `<tr><td style="font-size:12px;font-weight:700;color:#333;padding-bottom:4px;text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${titleInner}</td></tr>`;
      }
      if (imageUrl) {
        const absImg = escapeHtml(ensureAbsolutePublicUrl(normalizeImageUrl(imageUrl), origin));
        const imgTag = `<img src="${absImg}" width="200" border="0" alt="" style="display:block;max-width:200px;width:200px;height:auto;border:0;outline:none;text-decoration:none;border-radius:4px;" />`;
        if (url) {
          html += `<tr><td style="padding:0 0 4px 0;line-height:0;font-size:0;"><a href="${escapeHtml(url)}" style="text-decoration:none;border:0;outline:none;display:inline-block;">${imgTag}</a></td></tr>`;
        } else {
          html += `<tr><td style="padding:0 0 4px 0;line-height:0;font-size:0;">${imgTag}</td></tr>`;
        }
      }
      if (text) {
        html += `<tr><td style="font-size:12px;color:#555;line-height:1.4;padding-bottom:4px;">${text}</td></tr>`;
      }
      if (html) {
        parts.push(`<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:12px;" width="100%">${html}</table>`);
      }
    } else if (block.type === 'quote') {
      const quoteHtml = buildQuoteBlockHtml(block, primaryColor);
      if (quoteHtml) parts.push(quoteHtml);
    } else if (block.type === 'spotlight' && activeSpotlight) {
      const imageUrl = (activeSpotlight.signatureImageUrl || '').trim();
      if (imageUrl) {
        const absImg = escapeHtml(ensureAbsolutePublicUrl(normalizeImageUrl(imageUrl), origin));
        const linkUrl = `${origin}/spotlight/${activeSpotlight.slug}`;
        const imgTag = `<img src="${absImg}" border="0" alt="${escapeHtml(activeSpotlight.companyName)}" style="display:block;max-width:400px;width:100%;height:auto;border:0;outline:none;text-decoration:none;border-radius:4px;" />`;
        const wrapped = `<a href="${escapeHtml(linkUrl)}" style="text-decoration:none;border:0;outline:none;display:inline-block;width:100%;max-width:400px;">${imgTag}</a>`;
        parts.push(`<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:12px;" width="100%">
    <tr><td style="padding:0;line-height:0;font-size:0;">${wrapped}</td></tr>
  </table>`);
      }
    }
  }

  return parts;
}

/**
 * Render content blocks for side-column (desktop) and stacked (mobile/Gmail) layouts.
 */
function renderContentBlocksHtml(
  blocks: ContentBlockData[],
  origin: string,
  primaryColor: string,
  activeSpotlight?: RenderSignatureInput['activeSpotlight']
): { desktop: string; stacked: string } {
  const parts = buildContentBlockParts(blocks, origin, primaryColor, activeSpotlight);
  if (parts.length === 0) return { desktop: '', stacked: '' };

  const stacked = parts.join('');
  if (parts.length === 1) return { desktop: parts[0]!, stacked };

  const [left, right] = parts;
  const desktop = `<table class="sig-content-blocks-grid" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;">
<tr>
<td class="sig-content-block-cell sig-content-block-cell-left" valign="top" width="50%" style="vertical-align:top;width:50%;">${left}</td>
<td class="sig-content-block-cell sig-content-block-cell-right" valign="top" width="50%" style="vertical-align:top;width:50%;border-top:1px solid #e5e5e5;">${right}</td>
</tr>
</table>`;
  return { desktop, stacked };
}

/** Two-column footer for default layout: slot 0 left, slot 1 right. */
function buildDefaultListFooterHtml(
  blocks: ContentBlockData[],
  origin: string,
  primaryColor: string,
  activeSpotlight?: RenderSignatureInput['activeSpotlight']
): string {
  const enabled = blocks.filter((b) => b.enabled).slice(0, 2);
  if (enabled.length === 0) return '';

  function columnHtml(block: ContentBlockData): string {
    if (block.type === 'quote') {
      return buildQuoteBlockHtml(block, primaryColor);
    }
    if (block.type === 'spotlight' && activeSpotlight) {
      const imageUrl = (activeSpotlight.signatureImageUrl || '').trim();
      if (!imageUrl) return '';
      const absImg = escapeHtml(ensureAbsolutePublicUrl(normalizeImageUrl(imageUrl), origin));
      const linkUrl = `${origin}/spotlight/${activeSpotlight.slug}`;
      const imgTag = `<img src="${absImg}" border="0" alt="${escapeHtml(activeSpotlight.companyName)}" style="display:block;max-width:400px;width:100%;height:auto;border:0;outline:none;text-decoration:none;border-radius:4px;" />`;
      return `<a href="${escapeHtml(linkUrl)}" style="text-decoration:none;border:0;outline:none;display:inline-block;width:100%;max-width:400px;margin-bottom:12px;">${imgTag}</a>`;
    }
    if (block.type !== 'list') return '';
    const title = escapeHtml((block.listTitle || '').trim());
    const items = (block.listItems || []).filter(listItemHasBody).slice(0, 4);
    if (!title && items.length === 0) return '';

    let links = '';
    for (const item of items) {
      const titleTrim = (item.title || '').trim();
      const itemUrl = item.url
        ? normalizePromoUrl(item.url, item.urlPrefix === 'www' ? 'www' : 'https')
        : '';
      const labelRaw = titleTrim || (itemUrl ? listItemLinkFallbackLabel(itemUrl) : '');
      if (!labelRaw) continue;
      const label = escapeHtml(labelRaw);
      const href = itemUrl ? escapeHtml(itemUrl) : '';
      if (href) {
        links += `<a href="${href}" style="color: #555555; text-decoration: none; display: block; margin-bottom: 2px;">${label}</a>`;
      } else {
        links += `<span style="color: #555555; display: block; margin-bottom: 2px;">${label}</span>`;
      }
    }
    if (!links) return '';

    const header = title
      ? `<strong style="color: #111111; display: block; margin-bottom: 4px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">${title}</strong>`
      : '';
    return `${header}${links}`;
  }

  const left = enabled[0] ? columnHtml(enabled[0]) : '';
  const right = enabled[1] ? columnHtml(enabled[1]) : '';
  if (!left && !right) return '';

  const leftCell = left
    ? `<td valign="top" style="padding-right: 25px;">${left}</td>`
    : '';
  const rightCell = right ? `<td valign="top">${right}</td>` : '';

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-size: 12px; width: 100%; border-top: 1px solid #eeeeee; padding-top: 10px;">
  <tr>
    ${leftCell}
    ${rightCell}
  </tr>
</table>`;
}

/** Inline P | E | W row for default layout contact line. */
function buildDefaultContactRowHtml(
  officePhone: string,
  mobilePhone: string,
  officePhoneTelHref: string,
  mobilePhoneTelHref: string,
  email: string,
  website: string,
  websiteDisplay: string
): string {
  const parts: string[] = [];

  if (officePhone || mobilePhone) {
    let phoneInner = '';
    if (officePhone && mobilePhone) {
      phoneInner = `<a href="${escapeHtml(officePhoneTelHref)}" style="color: #555555; text-decoration: none;">${escapeHtml(officePhone)}</a> &nbsp;|&nbsp; <a href="${escapeHtml(mobilePhoneTelHref)}" style="color: #555555; text-decoration: none;">${escapeHtml(mobilePhone)}</a>`;
    } else if (officePhone) {
      phoneInner = `<a href="${escapeHtml(officePhoneTelHref)}" style="color: #555555; text-decoration: none;">${escapeHtml(officePhone)}</a>`;
    } else {
      phoneInner = `<a href="${escapeHtml(mobilePhoneTelHref)}" style="color: #555555; text-decoration: none;">${escapeHtml(mobilePhone)}</a>`;
    }
    parts.push(
      `<span style="font-weight: 600; color: #111111;">P:&nbsp;</span>${phoneInner}`
    );
  }

  if (email) {
    parts.push(
      `<span style="font-weight: 600; color: #111111;">E:&nbsp;</span><a href="mailto:${escapeHtml(email)}" style="color: #555555; text-decoration: none;">${escapeHtml(email)}</a>`
    );
  }

  if (website) {
    parts.push(
      `<span style="font-weight: 600; color: #111111;">W:&nbsp;</span><a href="${escapeHtml(website)}" style="color: #555555; text-decoration: none;">${escapeHtml(websiteDisplay)}</a>`
    );
  }

  return parts.join(' &nbsp;|&nbsp; ');
}

function companySlugForTagline(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_');
}

function buildCreatorTagline(title: string, companyName: string): string {
  const t = title.trim();
  const co = companyName.trim();
  if (!t && !co) return '';
  if (t && co) {
    return `&gt; ${escapeHtml(t)} @ ${escapeHtml(companySlugForTagline(co))}`;
  }
  if (t) return `&gt; ${escapeHtml(t)}`;
  return `&gt; @ ${escapeHtml(companySlugForTagline(co))}`;
}

const CREATOR_CARD_BACKGROUND = '#1e1f22';

function buildCreatorContactTableHtml(
  officePhone: string,
  mobilePhone: string,
  officePhoneTelHref: string,
  mobilePhoneTelHref: string,
  email: string,
  website: string,
  websiteDisplay: string,
  websiteLinkColor: string
): string {
  const rows: string[] = [];
  const phone = officePhone || mobilePhone;
  const phoneHref = officePhone ? officePhoneTelHref : mobilePhoneTelHref;
  if (phone) {
    rows.push(`<tr>
                <td style="padding-bottom: 4px; padding-right: 10px; font-family: 'Courier New', Courier, monospace; color: #80848e;">tel:</td>
                <td style="padding-bottom: 4px;"><a href="${escapeHtml(phoneHref)}" style="color: #dbdee1; text-decoration: none;">${escapeHtml(phone)}</a></td>
              </tr>`);
  }
  if (email) {
    rows.push(`<tr>
                <td style="padding-bottom: 4px; padding-right: 10px; font-family: 'Courier New', Courier, monospace; color: #80848e;">eml:</td>
                <td style="padding-bottom: 4px;"><a href="mailto:${escapeHtml(email)}" style="color: #dbdee1; text-decoration: none;">${escapeHtml(email)}</a></td>
              </tr>`);
  }
  if (website) {
    const linkColor = escapeHtml(websiteLinkColor);
    rows.push(`<tr>
                <td style="padding-bottom: 4px; padding-right: 10px; font-family: 'Courier New', Courier, monospace; color: #80848e;">web:</td>
                <td style="padding-bottom: 4px;"><a href="${escapeHtml(website)}" style="color: ${linkColor}; text-decoration: none;">${escapeHtml(websiteDisplay)}</a></td>
              </tr>`);
  }
  return rows.join('');
}

// removed buildDynamicContactHtml

function collectFlattenedListItems(blocks: ContentBlockData[]): Array<{
  title: string;
  url: string;
  urlPrefix?: 'https' | 'www';
}> {
  const out: Array<{ title: string; url: string; urlPrefix?: 'https' | 'www' }> = [];
  for (const block of blocks.filter((b) => b.enabled).slice(0, 2)) {
    if (block.type !== 'list' || !block.listItems) continue;
    for (const item of block.listItems.filter(listItemHasBody).slice(0, 4)) {
      out.push({
        title: (item.title || '').trim(),
        url: item.url ? normalizePromoUrl(item.url, item.urlPrefix === 'www' ? 'www' : 'https') : '',
        urlPrefix: item.urlPrefix,
      });
    }
  }
  return out;
}

function buildCreatorPromoPillsHtml(blocks: ContentBlockData[], panelColor: string): string {
  const quoteHtml = buildQuoteBlocksHtml(blocks, panelColor, true);
  const items = collectFlattenedListItems(blocks.filter((b) => b.type !== 'quote'));
  if (items.length === 0) return quoteHtml;

  const panel = escapeHtml(panelColor);
  let html = quoteHtml;
  for (const item of items) {
    const labelRaw = item.title || (item.url ? listItemLinkFallbackLabel(item.url) : '');
    if (!labelRaw) continue;
    const label = escapeHtml(labelRaw);
    const inner = item.url
      ? `<a href="${escapeHtml(item.url)}" style="color: #b5bac1; text-decoration: none;">${label}</a>`
      : label;
    html += `<span style="display: inline-block; background-color: ${panel}; padding: 4px 8px; border-radius: 4px; margin: 0 4px 6px 0;">${inner}</span>`;
  }
  return html;
}

function buildExecutiveRoleLine(title: string, companyName: string): string {
  const t = title.trim();
  const co = companyName.trim();
  if (t && co) return `${escapeHtml(t)}, ${escapeHtml(co)}`;
  if (t) return escapeHtml(t);
  if (co) return escapeHtml(co);
  return '';
}

function buildExecutiveContactLineHtml(
  officePhone: string,
  mobilePhone: string,
  officePhoneTelHref: string,
  mobilePhoneTelHref: string,
  email: string,
  website: string,
  websiteDisplay: string,
  primaryColor: string
): string {
  const parts: string[] = [];
  const phone = officePhone || mobilePhone;
  const phoneHref = officePhone ? officePhoneTelHref : mobilePhoneTelHref;
  if (phone) {
    parts.push(
      `<a href="${escapeHtml(phoneHref)}" style="color: #444444; text-decoration: none;">${escapeHtml(phone.replace(/-/g, '.'))}</a>`
    );
  }
  if (email) {
    parts.push(
      `<a href="mailto:${escapeHtml(email)}" style="color: #444444; text-decoration: none;">${escapeHtml(email)}</a>`
    );
  }
  if (website) {
    parts.push(
      `<a href="${escapeHtml(website)}" style="color: ${escapeHtml(primaryColor)}; text-decoration: none; font-weight: bold;">${escapeHtml(websiteDisplay)}</a>`
    );
  }
  return parts.join(' &nbsp;&bull;&nbsp; ');
}

function buildExecutiveSocialLineHtml(links: {
  linkedin: string;
  facebook: string;
  instagram: string;
  reddit: string;
  discord: string;
  bluesky: string;
  youtube: string;
}): string {
  const parts: string[] = [];
  if (links.linkedin) {
    parts.push(
      `<a href="${escapeHtml(links.linkedin)}" style="color: #666666; text-decoration: none;">LinkedIn</a>`
    );
  }
  if (links.facebook) {
    parts.push(
      `<a href="${escapeHtml(links.facebook)}" style="color: #666666; text-decoration: none;">Facebook</a>`
    );
  }
  if (links.instagram) {
    parts.push(
      `<a href="${escapeHtml(links.instagram)}" style="color: #666666; text-decoration: none;">Instagram</a>`
    );
  }
  if (links.reddit) {
    parts.push(
      `<a href="${escapeHtml(links.reddit)}" style="color: #666666; text-decoration: none;">Reddit</a>`
    );
  }
  if (links.discord) {
    parts.push(
      `<a href="${escapeHtml(links.discord)}" style="color: #666666; text-decoration: none;">Discord</a>`
    );
  }
  if (links.bluesky) {
    parts.push(
      `<a href="${escapeHtml(links.bluesky)}" style="color: #666666; text-decoration: none;">Bluesky</a>`
    );
  }
  if (links.youtube) {
    parts.push(
      `<a href="${escapeHtml(links.youtube)}" style="color: #666666; text-decoration: none;">YouTube</a>`
    );
  }
  return parts.join(' | ');
}

function buildExecutiveListBlockLineHtml(block: ContentBlockData, primaryColor: string): string {
  const items = (block.listItems || []).filter(listItemHasBody).slice(0, 4);
  if (items.length === 0) return '';

  const parts: string[] = [];
  for (const item of items) {
    const labelRaw = (item.title || '').trim() || (item.url ? listItemLinkFallbackLabel(item.url) : '');
    if (!labelRaw) continue;
    const label = escapeHtml(labelRaw);
    const itemDesc = item.description ? escapeHtml(item.description.trim()) : '';
    const url = item.url
      ? normalizePromoUrl(item.url, item.urlPrefix === 'www' ? 'www' : 'https')
      : '';
    let itemHtml = '';
    if (url) {
      itemHtml = `<a href="${escapeHtml(url)}" style="color: ${escapeHtml(primaryColor)}; text-decoration: none;">${label}</a>`;
    } else {
      itemHtml = `<span style="color: ${escapeHtml(primaryColor)};">${label}</span>`;
    }
    if (itemDesc) {
      itemHtml += ` <span style="color: #aaaaaa; font-weight: normal; text-transform: none;">${itemDesc}</span>`;
    }
    parts.push(itemHtml);
  }
  return parts.join(' | ');
}

function buildExecutivePromoRowsHtml(blocks: ContentBlockData[], primaryColor: string): string {
  const enabled = blocks.filter((b) => b.enabled).slice(0, 2);
  const rows: string[] = [];

  for (const block of enabled) {
    if (block.type === 'quote') {
      const quoteHtml = buildQuoteBlockHtml(block, primaryColor);
      if (quoteHtml) {
        rows.push(`<div style="margin-bottom: 8px;">${quoteHtml}</div>`);
      }
      continue;
    }
    if (block.type !== 'list') continue;
    const sectionLabel = (block.listTitle || block.customTitle || '').trim();
    const lineHtml = buildExecutiveListBlockLineHtml(block, primaryColor);
    if (!sectionLabel && !lineHtml) continue;

    const labelPart = sectionLabel
      ? `<strong>${escapeHtml(sectionLabel)}:</strong> &nbsp;`
      : '';
    rows.push(
      `<div style="font-size: 10px; color: #888888; text-transform: uppercase; margin-bottom: 4px;">${labelPart}${lineHtml}</div>`
    );
  }

  return rows.join('');
}

function buildPortfolioRoleLine(title: string, companyName: string): string {
  const t = title.trim();
  const co = companyName.trim();
  if (t && co) return `${escapeHtml(t)} @ ${escapeHtml(co)}`;
  if (t) return escapeHtml(t);
  if (co) return escapeHtml(co);
  return '';
}

function formatPortfolioPhoneDisplay(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone.trim();
}

function buildPortfolioContactPillsHtml(
  email: string,
  phone: string,
  phoneTelHref: string,
  website: string,
  websiteDisplay: string,
  accentColor: string,
  panelColor: string,
  borderColor: string,
  cardTextColor: string
): string {
  const rows: string[] = [];
  const accent = escapeHtml(accentColor);
  const panel = escapeHtml(panelColor);
  const border = escapeHtml(borderColor);
  const cardText = escapeHtml(cardTextColor);

  if (email) {
    rows.push(`<tr><td style="padding-bottom:10px;"><a href="mailto:${escapeHtml(email)}" style="display:block;background-color:${panel};color:#FFFFFF;text-decoration:none;padding:11px 16px;border-radius:30px;font-size:13px;font-weight:500;border:1px solid ${border};text-align:center;letter-spacing:0.2px;">&#9993; Email Me</a></td></tr>`);
  }
  if (phone && phoneTelHref) {
    const label = escapeHtml(formatPortfolioPhoneDisplay(phone));
    rows.push(`<tr><td style="padding-bottom:10px;"><a href="${escapeHtml(phoneTelHref)}" style="display:block;background-color:${panel};color:#FFFFFF;text-decoration:none;padding:11px 16px;border-radius:30px;font-size:13px;font-weight:500;border:1px solid ${border};text-align:center;letter-spacing:0.2px;">&#128222; ${label}</a></td></tr>`);
  }
  if (website) {
    const visitLabel = escapeHtml(`Visit ${websiteDisplay}`);
    rows.push(`<tr><td style="padding-bottom:20px;"><a href="${escapeHtml(website)}" style="display:block;background-color:${accent};color:${cardText};text-decoration:none;padding:12px 16px;border-radius:30px;font-size:13px;font-weight:700;text-align:center;letter-spacing:0.3px;">&#127760; ${visitLabel}</a></td></tr>`);
  } else if (rows.length > 0) {
    rows[rows.length - 1] = rows[rows.length - 1].replace('padding-bottom:10px', 'padding-bottom:20px');
  }

  return rows.join('');
}

function buildPortfolioNetworkSectionHtml(
  blocks: ContentBlockData[],
  accentColor: string,
  panelColor: string
): string {
  const quoteHtml = buildQuoteBlocksHtml(blocks, accentColor, true);
  const enabledLists = blocks.filter((b) => b.enabled && b.type === 'list');
  if (enabledLists.length === 0) return quoteHtml;

  const items = collectFlattenedListItems(enabledLists);
  if (items.length === 0) return '';

  const sectionTitle =
    enabledLists.map((b) => (b.listTitle || b.customTitle || '').trim()).find(Boolean) ||
    'Network Portfolio';
  const accent = escapeHtml(accentColor);
  const panel = escapeHtml(panelColor);

  let pills = '';
  for (const item of items) {
    const labelRaw = item.title || (item.url ? listItemLinkFallbackLabel(item.url) : '');
    if (!labelRaw) continue;
    const label = escapeHtml(labelRaw);
    if (item.url) {
      pills += `<a href="${escapeHtml(item.url)}" style="display:inline-block;background-color:${panel};color:#F4F7F6;text-decoration:none;padding:6px 12px;border-radius:12px;font-size:12px;margin:0 6px 6px 0;font-weight:500;">${label}</a>`;
    } else {
      pills += `<span style="display:inline-block;background-color:${panel};color:#F4F7F6;padding:6px 12px;border-radius:12px;font-size:12px;margin:0 6px 6px 0;font-weight:500;">${label}</span>`;
    }
  }
  if (!pills) return quoteHtml;

  const listSection = `<div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${accent};font-weight:bold;margin-bottom:10px;text-align:left;">${escapeHtml(sectionTitle)}</div><div style="text-align:left;margin-bottom:18px;line-height:1.6;">${pills}</div>`;
  return quoteHtml ? `${quoteHtml}${listSection}` : listSection;
}

function buildEcardContactTableHtml(
  officePhone: string,
  mobilePhone: string,
  officePhoneTelHref: string,
  mobilePhoneTelHref: string,
  email: string,
  website: string,
  websiteDisplay: string,
  primaryColor: string
): string {
  const rows: string[] = [];
  const accent = escapeHtml(primaryColor);
  const phone = officePhone || mobilePhone;
  const phoneHref = officePhone ? officePhoneTelHref : mobilePhoneTelHref;

  if (phone && phoneHref) {
    const label = escapeHtml(formatPortfolioPhoneDisplay(phone));
    rows.push(
      `<tr><td style="padding-bottom:6px;font-weight:bold;color:#111827;width:24px;">P:</td><td style="padding-bottom:6px;"><a href="${escapeHtml(phoneHref)}" style="color:#4B5563;text-decoration:none;">${label}</a></td></tr>`
    );
  }
  if (email) {
    rows.push(
      `<tr><td style="padding-bottom:6px;font-weight:bold;color:#111827;">E:</td><td style="padding-bottom:6px;"><a href="mailto:${escapeHtml(email)}" style="color:#4B5563;text-decoration:none;">${escapeHtml(email)}</a></td></tr>`
    );
  }
  if (website) {
    rows.push(
      `<tr><td style="padding-bottom:14px;font-weight:bold;color:#111827;">W:&nbsp;</td><td style="padding-bottom:14px;"><a href="${escapeHtml(website)}" style="color:${accent};text-decoration:none;font-weight:600;">${escapeHtml(websiteDisplay)}</a></td></tr>`
    );
  } else if (rows.length > 0) {
    rows[rows.length - 1] = rows[rows.length - 1].replace('padding-bottom:6px', 'padding-bottom:14px');
  }

  return rows.join('');
}

function joinEcardPortfolioLinkParts(parts: string[]): string {
  if (parts.length === 0) return '';
  let linksHtml = parts[0]!;
  for (let i = 1; i < parts.length; i++) {
    if (i % 3 === 0) {
      linksHtml += `<br>${parts[i]}`;
    } else {
      linksHtml += ` &bull; ${parts[i]}`;
    }
  }
  return linksHtml;
}

function buildEcardListBlockLinksHtml(block: ContentBlockData, primaryColor: string): string {
  if (block.type !== 'list' || !block.listItems) return '';
  const accent = escapeHtml(primaryColor);
  const parts: string[] = [];

  for (const item of block.listItems.filter(listItemHasBody).slice(0, 4)) {
    const labelRaw =
      (item.title || '').trim() || (item.url ? listItemLinkFallbackLabel(item.url) : '');
    if (!labelRaw) continue;
    const label = escapeHtml(labelRaw);
    const url = item.url
      ? normalizePromoUrl(item.url, item.urlPrefix === 'www' ? 'www' : 'https')
      : '';
    if (url) {
      parts.push(
        `<a href="${escapeHtml(url)}" style="color:${accent};text-decoration:none;font-weight:500;">${label}</a>`
      );
    } else {
      parts.push(`<span style="color:${accent};font-weight:500;">${label}</span>`);
    }
  }

  return joinEcardPortfolioLinkParts(parts);
}

/** One titled section per list promo block (up to two), preserving each block's listTitle. */
function buildEcardPortfolioSectionsHtml(blocks: ContentBlockData[], primaryColor: string): string {
  const quoteHtml = buildQuoteBlocksHtml(blocks, primaryColor);
  const enabledLists = blocks.filter((b) => b.enabled && b.type === 'list').slice(0, 2);
  if (enabledLists.length === 0) return quoteHtml;

  const sections: string[] = quoteHtml ? [quoteHtml] : [];
  for (const block of enabledLists) {
    const linksHtml = buildEcardListBlockLinksHtml(block, primaryColor);
    if (!linksHtml) continue;
    const sectionTitle =
      (block.listTitle || block.customTitle || '').trim() || 'Portfolio';
    const marginTop = sections.length > 0 ? 'margin-top:10px;' : '';
    sections.push(
      `<div style="${marginTop}"><strong style="color:#111827;display:block;margin-bottom:4px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(sectionTitle)}</strong>${linksHtml}</div>`
    );
  }

  return sections.join('');
}

function layoutSocialTdStyles(
  linkedin: string,
  facebook: string,
  instagram: string,
  reddit: string,
  discord: string,
  bluesky: string,
  youtube: string,
  gap: string
): Record<string, string> {
  const keys = ['li', 'fb', 'ig', 'rd', 'dc', 'bs', 'yt'] as const;
  const values = [linkedin, facebook, instagram, reddit, discord, bluesky, youtube];
  const result: Record<string, string> = { li: '', fb: '', ig: '', rd: '', dc: '', bs: '', yt: '' };
  for (let i = 0; i < values.length; i += 1) {
    if (!values[i]) continue;
    const hasMore = values.slice(i + 1).some(Boolean);
    result[keys[i]!] = hasMore
      ? `padding: 0 ${gap} 0 0; vertical-align: middle;`
      : 'padding: 0; vertical-align: middle;';
  }
  return result;
}

/**
 * Append UTM parameters to http/https links in rendered HTML.
 * Skips mailto:, tel:, and anchor-only (#) links.
 */
function appendUtmParams(
  html: string,
  utm: { source: string; medium: string; campaign: string }
): string {
  const params = `utm_source=${encodeURIComponent(utm.source)}&utm_medium=${encodeURIComponent(utm.medium)}&utm_campaign=${encodeURIComponent(utm.campaign)}`;

  return html.replace(/href="(https?:\/\/[^"]+)"/gi, (_match, url: string) => {
    try {
      const separator = url.includes('?') ? '&' : '?';
      return `href="${url}${separator}${params}"`;
    } catch {
      return _match;
    }
  });
}

export function mergeRenderContext(
  profile: SignatureProfile,
  brand: SignatureBrand,
  template: SignatureTemplate,
  siteOrigin: string = DEFAULT_PUBLIC_SITE_ORIGIN,
  vcardDownloadUrl?: string,
  activeSpotlight?: RenderSignatureInput['activeSpotlight']
): {
  evalCtx: Record<string, string | boolean | undefined>;
  stringCtx: Record<string, string>;
} {
  const origin = stripTrailingSlash(siteOrigin.trim() || DEFAULT_PUBLIC_SITE_ORIGIN);
  const { elements } = template;
  
  const pHidden = profile.hiddenFields || [];
  const bHidden = brand.hiddenFields || [];

  const hasLogo = hasElement(elements, 'logo') && !bHidden.includes('companyName') /* wait, companyName or logo? the UI just hides companyName and website */ && !bHidden.includes('logoUrl');
  const hasName = hasElement(elements, 'name') && !(pHidden.includes('firstName') && pHidden.includes('lastName'));
  const hasTitle = hasElement(elements, 'title') && !pHidden.includes('title');
  const hasContact = hasElement(elements, 'contact');
  const hasSocial = hasElement(elements, 'social');
  const hasDivider = hasElement(elements, 'divider');
  const hasAddressEl = hasElement(elements, 'address');
  const hasAnimationEl = hasElement(elements, 'animation');
  const hasContentBlocksEl = hasElement(elements, 'contentBlocks');

  const useAnimation =
    hasAnimationEl &&
    Boolean(brand.animation?.enabled) &&
    Boolean(brand.animation?.gifUrl?.trim());

  const rawLogoUrl = useAnimation ? brand.animation!.gifUrl!.trim() : brand.logoUrl.trim();
  const logoUrl = normalizeImageUrl(ensureAbsolutePublicUrl(rawLogoUrl, origin));

  const website = normalizeWebsite(brand.website);
  // Display value strips the protocol so it reads cleanly as "example.com" while the
  // href stays a fully qualified URL.
  const websiteDisplay = website
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  const logoLinkForHref =
    brand.logoLink.trim() || website || stripTrailingSlash(origin);

  const explicitLogoH =
    typeof brand.logoHeightPx === 'number' &&
    Number.isFinite(brand.logoHeightPx) &&
    brand.logoHeightPx > 0 &&
    brand.logoHeightPx <= 400;
  const logoHeightPxRounded =
    explicitLogoH && typeof brand.logoHeightPx === 'number'
      ? Math.round(brand.logoHeightPx)
      : 0;

  const isPortfolioLayout = template.layout === 'portfolio';
  const isEcardLayout = template.layout === 'ecard';
  const useCircleLogo = hasLogo && !useAnimation && brand.logoShape === 'circle';
  const logoWidthStr = hasLogo ? logoWidthForLayout(template.layout, useCircleLogo) : '110';

  let logoDisplayHeightStr = '';
  let hasLogoSizedHeight = false;
  let hasLogoAutoHeight = false;
  if (hasLogo) {
    if (useCircleLogo) {
      logoDisplayHeightStr = logoWidthStr;
      hasLogoSizedHeight = true;
    } else {
      const resolved = resolveLogoDisplayHeight(
        parseInt(logoWidthStr, 10) || 110,
        explicitLogoH ? logoHeightPxRounded : brand.logoHeightPx,
        useAnimation
      );
      if (resolved.useAutoHeight) {
        hasLogoAutoHeight = true;
      } else {
        logoDisplayHeightStr = resolved.displayHeight;
        hasLogoSizedHeight = true;
      }
    }
  }

  const logoImgBorderRadius = hasLogo
    ? logoImgBorderRadiusForLayout(template.layout, useCircleLogo)
    : '0';

  const linkedin =
    hasSocial && brand.socialLinks.linkedin?.trim()
      ? brand.socialLinks.linkedin.trim()
      : '';
  const facebook =
    hasSocial && brand.socialLinks.facebook?.trim()
      ? brand.socialLinks.facebook.trim()
      : '';
  const instagram =
    hasSocial && brand.socialLinks.instagram?.trim()
      ? brand.socialLinks.instagram.trim()
      : '';
  const reddit =
    hasSocial && brand.socialLinks.reddit?.trim()
      ? brand.socialLinks.reddit.trim()
      : '';
  const discord =
    hasSocial && brand.socialLinks.discord?.trim()
      ? brand.socialLinks.discord.trim()
      : '';
  const bluesky =
    hasSocial && brand.socialLinks.bluesky?.trim()
      ? brand.socialLinks.bluesky.trim()
      : '';
  const youtube =
    hasSocial && brand.socialLinks.youtube?.trim()
      ? brand.socialLinks.youtube.trim()
      : '';

  const addressLine =
    hasAddressEl && brand.address?.trim() ? brand.address.trim() : '';
  const cityLine = hasAddressEl && brand.city?.trim() ? brand.city.trim() : '';
  const stateLine = hasAddressEl && brand.state?.trim() ? brand.state.trim() : '';
  const zipLine = hasAddressEl && brand.zip?.trim() ? brand.zip.trim() : '';

  const isModernProfessional = template.layout === 'modern_professional';
  const showSocialBlock = hasSocial && Boolean(
    (isModernProfessional && website) || linkedin || facebook || instagram || reddit || discord || bluesky || youtube
  );

  let socialTdLiStyle = '';
  let socialTdFbStyle = '';
  let socialTdIgStyle = '';
  let socialTdRedditStyle = '';
  let socialTdDiscordStyle = '';
  let socialTdBlueskyStyle = '';
  let socialTdYoutubeStyle = '';
  if (linkedin) {
    socialTdLiStyle =
      facebook || instagram || reddit || discord || bluesky || youtube
        ? 'padding:0 6px 0 0;vertical-align:middle;'
        : 'padding:0;vertical-align:middle;';
  }
  if (facebook) {
    socialTdFbStyle = instagram || reddit || discord || bluesky || youtube
      ? 'padding:0 6px 0 0;vertical-align:middle;'
      : 'padding:0;vertical-align:middle;';
  }
  if (instagram) {
    socialTdIgStyle = reddit || discord || bluesky || youtube
      ? 'padding:0 6px 0 0;vertical-align:middle;'
      : 'padding:0;vertical-align:middle;';
  }
  if (reddit) {
    socialTdRedditStyle = discord || bluesky || youtube
      ? 'padding:0 6px 0 0;vertical-align:middle;'
      : 'padding:0;vertical-align:middle;';
  }
  if (discord) {
    socialTdDiscordStyle = bluesky || youtube
      ? 'padding:0 6px 0 0;vertical-align:middle;'
      : 'padding:0;vertical-align:middle;';
  }
  if (bluesky) {
    socialTdBlueskyStyle = youtube
      ? 'padding:0 6px 0 0;vertical-align:middle;'
      : 'padding:0;vertical-align:middle;';
  }
  if (youtube) {
    socialTdYoutubeStyle = 'padding:0;vertical-align:middle;';
  }

  const showAddressBlock = hasAddressEl && Boolean(addressLine || cityLine || stateLine || zipLine);
  const addressBlockLines: string[] = [];
  if (addressLine) addressBlockLines.push(escapeHtml(addressLine));
  const localityLine = [cityLine, [stateLine, zipLine].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  if (localityLine) addressBlockLines.push(escapeHtml(localityLine));
  const addressBlockHtml = addressBlockLines.join('<br/>');

  const officePhoneRaw = profile.officePhone?.trim() ?? '';
  const mobilePhoneRaw = profile.mobilePhone?.trim() ?? '';
  const officePhone = hasContact && officePhoneRaw ? officePhoneRaw : '';
  const mobilePhone = hasContact && mobilePhoneRaw ? mobilePhoneRaw : '';
  const officePhoneTelHref = officePhone ? telHref(officePhone) : '';
  const mobilePhoneTelHref = mobilePhone ? telHref(mobilePhone) : '';

  // Content blocks
  const contentBlocks = brand.contentBlocks?.filter((b) => b.enabled) ?? [];
  const hasContentBlocks = hasContentBlocksEl && contentBlocks.length > 0;
  const brandPrimaryColor = brand.primaryColor.trim() || '#2563eb';
  const contentBlocksRendered = hasContentBlocks
    ? renderContentBlocksHtml(contentBlocks, origin, brandPrimaryColor, activeSpotlight)
    : { desktop: '', stacked: '' };
  const isDefaultLayout = template.layout === 'default';
  const isCreatorLayout = template.layout === 'creator';
  const isExecutiveLayout = template.layout === 'executive_minimalist';
  const usesCustomPromoLayout =
    isDefaultLayout ||
    isCreatorLayout ||
    isExecutiveLayout ||
    isPortfolioLayout ||
    isEcardLayout;
  const brandSecondaryColor =
    brand.secondaryColor?.trim() || brand.primaryColor.trim() || '#2563eb';
  const portfolioPanelColor = isPortfolioLayout
    ? adjustHexLightness(brandPrimaryColor, 0.1)
    : '';
  const portfolioBorderColor = isPortfolioLayout
    ? adjustHexLightness(brandPrimaryColor, 0.18)
    : '';
  const creatorCardBackground = isCreatorLayout ? CREATOR_CARD_BACKGROUND : '';
  const creatorPanelColor = isCreatorLayout
    ? adjustHexLightness(CREATOR_CARD_BACKGROUND, 0.08)
    : '';
  const creatorAccentColor = isCreatorLayout
    ? brand.secondaryColor?.trim()
      ? brand.secondaryColor.trim()
      : adjustHexLightness(brandPrimaryColor, 0.2)
    : '';
  const useVerticalBlocksOnly = template.layout === 'stacked';
  const contentBlocksHtml = usesCustomPromoLayout
    ? ''
    : useVerticalBlocksOnly
      ? contentBlocksRendered.stacked
      : contentBlocksRendered.desktop;
  const contentBlocksHtmlStacked = usesCustomPromoLayout ? '' : contentBlocksRendered.stacked;

  const defaultListFooterHtml = isDefaultLayout
    ? buildDefaultListFooterHtml(contentBlocks, origin, brandPrimaryColor, activeSpotlight)
    : '';
  const hasDefaultListFooter = Boolean(defaultListFooterHtml);

  const fullName = [profile.firstName.trim(), profile.lastName.trim()].filter(Boolean).join(' ');

  const orderedContactInput: OrderedContactBuildInput = {
    layout: template.layout,
    contactDisplayOrder: profile.contactDisplayOrder,
    brandOrder: brand.brandOrder,
    fullName,
    title: profile.title.trim(),
    email: profile.email.trim(),
    officePhone,
    mobilePhone,
    officePhoneTelHref,
    mobilePhoneTelHref,
    website,
    websiteDisplay,
    companyName: brand.companyName.trim(),
    primaryColor: brandPrimaryColor,
    hasName,
    hasTitle,
    hasLogo,
    hasLogoSizedHeight,
    hasLogoAutoHeight,
    logoUrl,
    logoLink: logoLinkForHref,
    logoWidthStr,
    logoDisplayHeightStr,
    logoImgBorderRadius,
    pHidden,
    bHidden,
    addressBlockHtml,
    showAddressBlock,
    creatorAccentColor,
    portfolioPanelColor,
    portfolioBorderColor,
    portfolioAccentColor: brandSecondaryColor,
    portfolioCardTextColor: brandPrimaryColor,
    formatPortfolioPhoneDisplay,
  };

  const orderedMainStackLayouts = new Set([
    'default',
    'standard',
    'corporate',
    'professional',
    'stacked',
  ]);
  const orderedMainStackHtml = orderedMainStackLayouts.has(template.layout)
    ? buildOrderedMainStackHtml(orderedContactInput)
    : '';
  const hasOrderedMainStack = Boolean(orderedMainStackHtml);

  const defaultContactRowHtml =
    isDefaultLayout && hasContact && !hasOrderedMainStack
      ? buildDefaultContactRowHtml(
          officePhone,
          mobilePhone,
          officePhoneTelHref,
          mobilePhoneTelHref,
          profile.email.trim(),
          website,
          websiteDisplay
        )
      : '';
  const hasDefaultContactRow = Boolean(defaultContactRowHtml) || (isDefaultLayout && hasOrderedMainStack);

  let defaultSocialTdLiStyle = '';
  let defaultSocialTdFbStyle = '';
  let defaultSocialTdIgStyle = '';
  let defaultSocialTdRedditStyle = '';
  let defaultSocialTdDiscordStyle = '';
  let defaultSocialTdBlueskyStyle = '';
  let defaultSocialTdYoutubeStyle = '';
  if (isDefaultLayout && linkedin) {
    defaultSocialTdLiStyle =
      facebook || instagram || reddit || discord || bluesky || youtube
        ? 'padding: 0 8px 0 0; vertical-align: middle;'
        : 'padding: 0; vertical-align: middle;';
  }
  if (isDefaultLayout && facebook) {
    defaultSocialTdFbStyle = instagram || reddit || discord || bluesky || youtube
      ? 'padding: 0 8px 0 0; vertical-align: middle;'
      : 'padding: 0; vertical-align: middle;';
  }
  if (isDefaultLayout && instagram) {
    defaultSocialTdIgStyle = reddit || discord || bluesky || youtube
      ? 'padding: 0 8px 0 0; vertical-align: middle;'
      : 'padding: 0; vertical-align: middle;';
  }
  if (isDefaultLayout && reddit) {
    defaultSocialTdRedditStyle = discord || bluesky || youtube
      ? 'padding: 0 8px 0 0; vertical-align: middle;'
      : 'padding: 0; vertical-align: middle;';
  }
  if (isDefaultLayout && discord) {
    defaultSocialTdDiscordStyle = bluesky || youtube
      ? 'padding: 0 8px 0 0; vertical-align: middle;'
      : 'padding: 0; vertical-align: middle;';
  }
  if (isDefaultLayout && bluesky) {
    defaultSocialTdBlueskyStyle = youtube
      ? 'padding: 0 8px 0 0; vertical-align: middle;'
      : 'padding: 0; vertical-align: middle;';
  }
  if (isDefaultLayout && youtube) {
    defaultSocialTdYoutubeStyle = 'padding: 0; vertical-align: middle;';
  }
  const mpMiddleColumnHtml =
    template.layout === 'modern_professional'
      ? buildMpMiddleColumnHtml(orderedContactInput)
      : '';
  const creatorTagline =
    isCreatorLayout && (hasTitle || brand.companyName.trim())
      ? buildCreatorTagline(profile.title.trim(), brand.companyName.trim())
      : '';
  const hasCreatorTagline = Boolean(creatorTagline);
  const creatorContactTableHtml =
    isCreatorLayout && hasContact
      ? buildCreatorContactTableHtmlOrdered(orderedContactInput)
      : '';
  const hasCreatorContactTable = Boolean(creatorContactTableHtml);
  const creatorPromoPillsHtml = isCreatorLayout
    ? buildCreatorPromoPillsHtml(contentBlocks, creatorPanelColor)
    : '';
  const hasCreatorPromoPills = Boolean(creatorPromoPillsHtml);

  const creatorSocial = isCreatorLayout
    ? layoutSocialTdStyles(linkedin, facebook, instagram, reddit, discord, bluesky, youtube, '4px')
    : { li: '', fb: '', ig: '', rd: '', dc: '', bs: '', yt: '' };

  const executiveRoleLine =
    isExecutiveLayout && (hasTitle || brand.companyName.trim())
      ? buildExecutiveRoleLine(profile.title.trim(), brand.companyName.trim())
      : '';
  const hasExecutiveRoleLine = Boolean(executiveRoleLine);
  const executiveContactLineHtml =
    isExecutiveLayout && hasContact
      ? buildExecutiveContactLineHtmlOrdered(orderedContactInput)
      : '';
  const hasExecutiveContactLine = Boolean(executiveContactLineHtml);
  const executiveSocialLineHtml =
    isExecutiveLayout && showSocialBlock
      ? buildExecutiveSocialLineHtml({ linkedin, facebook, instagram, reddit, discord, bluesky, youtube })
      : '';
  const hasExecutiveSocialLine = Boolean(executiveSocialLineHtml);
  const executivePromoRowsHtml = isExecutiveLayout
    ? buildExecutivePromoRowsHtml(contentBlocks, brand.primaryColor.trim() || '#901a1e')
    : '';
  const hasExecutivePromoRows = Boolean(executivePromoRowsHtml);

  const portfolioRoleLine =
    isPortfolioLayout && (hasTitle || brand.companyName.trim())
      ? buildPortfolioRoleLine(profile.title.trim(), brand.companyName.trim())
      : '';
  const hasPortfolioRoleLine = Boolean(portfolioRoleLine);
  const portfolioPhone = officePhone || mobilePhone;
  const portfolioPhoneTelHref = officePhone ? officePhoneTelHref : mobilePhoneTelHref;
  const portfolioContactPillsHtml =
    isPortfolioLayout && hasContact
      ? buildPortfolioContactPillsHtmlOrdered(orderedContactInput)
      : '';
  const hasPortfolioContactPills = Boolean(portfolioContactPillsHtml);
  const portfolioNetworkSectionHtml = isPortfolioLayout
    ? buildPortfolioNetworkSectionHtml(contentBlocks, brandSecondaryColor, portfolioPanelColor)
    : '';
  const hasPortfolioNetworkSection = Boolean(portfolioNetworkSectionHtml);

  const portfolioSocial = isPortfolioLayout
    ? layoutSocialTdStyles(linkedin, facebook, instagram, reddit, discord, bluesky, youtube, '10px')
    : { li: '', fb: '', ig: '', rd: '', dc: '', bs: '', yt: '' };

  const ecardRoleLine =
    isEcardLayout && (hasTitle || brand.companyName.trim())
      ? buildPortfolioRoleLine(profile.title.trim(), brand.companyName.trim())
      : '';
  const hasEcardRoleLine = Boolean(ecardRoleLine);
  const ecardPhone = officePhone || mobilePhone;
  const ecardPhoneTelHref = officePhone ? officePhoneTelHref : mobilePhoneTelHref;
  const ecardContactTableHtml =
    isEcardLayout && hasContact
      ? buildEcardContactTableHtmlOrdered(orderedContactInput)
      : '';
  const hasEcardContactTable = Boolean(ecardContactTableHtml);
  const ecardPortfolioSectionsHtml = isEcardLayout
    ? buildEcardPortfolioSectionsHtml(contentBlocks, brandPrimaryColor)
    : '';
  const hasEcardPortfolioSection = Boolean(ecardPortfolioSectionsHtml);
  const ecardLogoFrameWidth =
    isEcardLayout && hasLogo ? String(parseInt(logoWidthStr, 10) + 24) : '';
  const ecardVcardUrlTrimmed = (vcardDownloadUrl ?? '').trim();
  const hasEcardVcardUrl = isEcardLayout && Boolean(ecardVcardUrlTrimmed);
  const hasEcardFooter = isEcardLayout && (hasEcardPortfolioSection || showSocialBlock);
  const ecardSocial = isEcardLayout
    ? layoutSocialTdStyles(linkedin, facebook, instagram, reddit, discord, bluesky, youtube, '8px')
    : { li: '', fb: '', ig: '', rd: '', dc: '', bs: '', yt: '' };

  /** Standard layout: optional third column for blocks (stacked keeps blocks below). */
  const sideColumnContentBlocks =
    template.layout !== 'stacked' &&
    template.layout !== 'professional' &&
    !usesCustomPromoLayout &&
    hasContentBlocks;
  const signatureRootColspan =
    template.layout === 'standard' && hasContentBlocks ? '3' : '2';

  const avatarUrlRaw = profile.avatarUrl?.trim() || '';
  const avatarUrl = avatarUrlRaw ? normalizeImageUrl(ensureAbsolutePublicUrl(avatarUrlRaw, origin)) : '';

  const evalCtx: Record<string, string | boolean | undefined> = {
    hasLogo,
    hasName,
    hasTitle,
    hasContact,
    hasDivider,
    hasOfficePhone: Boolean(officePhone),
    hasMobilePhone: Boolean(mobilePhone),
    showSocialBlock,
    showAddressBlock,
    hasLinkedin: Boolean(linkedin),
    hasFacebook: Boolean(facebook),
    hasInstagram: Boolean(instagram),
    hasReddit: Boolean(reddit),
    hasDiscord: Boolean(discord),
    hasBluesky: Boolean(bluesky),
    hasYoutube: Boolean(youtube),
    hasLogoSizedHeight,
    hasLogoAutoHeight,
    hasContentBlocks,
    sideColumnContentBlocks,
    hasWebsite: Boolean(website),
    hasDefaultListFooter,
    hasDefaultContactRow,
    hasCreatorTagline,
    hasCreatorContactTable,
    hasCreatorPromoPills,
    hasExecutiveRoleLine,
    hasExecutiveContactLine,
    hasExecutiveSocialLine,
    hasExecutivePromoRows,
    hasExecutiveLogoColumn:
      isExecutiveLayout &&
      (hasLogo || (hasAddressEl && Boolean(addressLine || cityLine || stateLine || zipLine))),
    hasPortfolioRoleLine,
    hasPortfolioContactPills,
    hasPortfolioNetworkSection,
    hasEcardRoleLine,
    hasEcardContactTable,
    hasEcardVcardUrl,
    hasEcardPortfolioSection,
    hasEcardFooter,
    hasAvatar: Boolean(avatarUrl) && !pHidden.includes('avatarUrl'),
    hasOrderedMainStack,
  };

  const stringCtx: Record<string, string> = {
    fullName: hasName ? escapeHtml(fullName) : '',
    firstName: pHidden.includes('firstName') ? '' : escapeHtml(profile.firstName.trim()),
    lastName: pHidden.includes('lastName') ? '' : escapeHtml(profile.lastName.trim()),
    title: hasTitle ? escapeHtml(profile.title.trim()) : '',
    email: escapeHtml(profile.email.trim()),
    officePhone: escapeHtml(officePhone),
    officePhoneTelHref: escapeHtml(officePhoneTelHref),
    mobilePhone: escapeHtml(mobilePhone),
    mobilePhoneTelHref: escapeHtml(mobilePhoneTelHref),
    avatarUrl: pHidden.includes('avatarUrl') ? '' : escapeHtml(avatarUrl),
    logoUrl: bHidden.includes('logoUrl') ? '' : escapeHtml(logoUrl),
    logoLink: escapeHtml(logoLinkForHref),
    logoWidth: logoWidthStr,
    logoDisplayHeight: logoDisplayHeightStr,
    logoImgBorderRadius,
    primaryColor: escapeHtml(brandPrimaryColor),
    secondaryColor: escapeHtml(brandSecondaryColor),
    portfolioPanelColor: escapeHtml(portfolioPanelColor),
    portfolioBorderColor: escapeHtml(portfolioBorderColor),
    creatorCardBackground: escapeHtml(creatorCardBackground),
    creatorPanelColor: escapeHtml(creatorPanelColor),
    creatorAccentColor: escapeHtml(creatorAccentColor),
    fontFamily: escapeHtml(brand.fontFamily.trim()),
    companyName: bHidden.includes('companyName') ? '' : escapeHtml(brand.companyName.trim()),
    website: bHidden.includes('website') ? '' : escapeHtml(website),
    websiteDisplay: bHidden.includes('website') ? '' : escapeHtml(websiteDisplay),
    linkedin: escapeHtml(linkedin),
    facebook: escapeHtml(facebook),
    instagram: escapeHtml(instagram),
    reddit: escapeHtml(reddit),
    discord: escapeHtml(discord),
    bluesky: escapeHtml(bluesky),
    youtube: escapeHtml(youtube),
    addressBlockHtml,
    iconLinkedin: normalizeImageUrl(ensureAbsolutePublicUrl(SOCIAL_ICON_LINKEDIN, origin)),
    iconFacebook: normalizeImageUrl(ensureAbsolutePublicUrl(SOCIAL_ICON_FACEBOOK, origin)),
    iconInstagram: normalizeImageUrl(ensureAbsolutePublicUrl(SOCIAL_ICON_INSTAGRAM, origin)),
    iconReddit: normalizeImageUrl(ensureAbsolutePublicUrl(SOCIAL_ICON_REDDIT, origin)),
    iconDiscord: normalizeImageUrl(ensureAbsolutePublicUrl(SOCIAL_ICON_DISCORD, origin)),
    iconBluesky: normalizeImageUrl(ensureAbsolutePublicUrl(SOCIAL_ICON_BLUESKY, origin)),
    iconYoutube: normalizeImageUrl(ensureAbsolutePublicUrl(SOCIAL_ICON_YOUTUBE, origin)),
    iconGlobe: normalizeImageUrl(ensureAbsolutePublicUrl(SOCIAL_ICON_GLOBE, origin)),
    socialTdLiStyle,
    socialTdFbStyle,
    socialTdIgStyle,
    socialTdRedditStyle,
    socialTdDiscordStyle,
    socialTdBlueskyStyle,
    socialTdYoutubeStyle,
    contentBlocksHtml,
    contentBlocksHtmlStacked,
    signatureRootColspan,
    defaultListFooterHtml,
    defaultContactRowHtml,
    defaultSocialTdLiStyle,
    defaultSocialTdFbStyle,
    defaultSocialTdIgStyle,
    defaultSocialTdRedditStyle,
    defaultSocialTdDiscordStyle,
    defaultSocialTdBlueskyStyle,
    defaultSocialTdYoutubeStyle,
    creatorTagline,
    creatorContactTableHtml,
    creatorPromoPillsHtml,
    creatorSocialTdLiStyle: creatorSocial.li,
    creatorSocialTdFbStyle: creatorSocial.fb,
    creatorSocialTdIgStyle: creatorSocial.ig,
    creatorSocialTdRedditStyle: creatorSocial.rd,
    creatorSocialTdDiscordStyle: creatorSocial.dc,
    creatorSocialTdBlueskyStyle: creatorSocial.bs,
    creatorSocialTdYoutubeStyle: creatorSocial.yt,
    executiveRoleLine,
    executiveContactLineHtml,
    executiveSocialLineHtml,
    executivePromoRowsHtml,
    portfolioRoleLine: hasPortfolioRoleLine ? escapeHtml(portfolioRoleLine) : '',
    portfolioContactPillsHtml,
    portfolioNetworkSectionHtml,
    portfolioSocialTdLiStyle: portfolioSocial.li,
    portfolioSocialTdFbStyle: portfolioSocial.fb,
    portfolioSocialTdIgStyle: portfolioSocial.ig,
    portfolioSocialTdRedditStyle: portfolioSocial.rd,
    portfolioSocialTdDiscordStyle: portfolioSocial.dc,
    portfolioSocialTdBlueskyStyle: portfolioSocial.bs,
    portfolioSocialTdYoutubeStyle: portfolioSocial.yt,
    ecardRoleLine: hasEcardRoleLine ? escapeHtml(ecardRoleLine) : '',
    ecardContactTableHtml,
    ecardPortfolioSectionsHtml,
    ecardLogoFrameWidth,
    ecardVcardUrl: escapeHtml(ecardVcardUrlTrimmed),
    ecardSocialTdLiStyle: ecardSocial.li,
    ecardSocialTdFbStyle: ecardSocial.fb,
    ecardSocialTdIgStyle: ecardSocial.ig,
    ecardSocialTdRedditStyle: ecardSocial.rd,
    ecardSocialTdDiscordStyle: ecardSocial.dc,
    ecardSocialTdBlueskyStyle: ecardSocial.bs,
    ecardSocialTdYoutubeStyle: ecardSocial.yt,
    mpMiddleColumnHtml,
    orderedMainStackHtml,
  };

  return { evalCtx, stringCtx };
}

function pickTemplate(layout: SignatureTemplate['layout']): string {
  if (layout === 'creator') return CREATOR_SIGNATURE_TEMPLATE;
  if (layout === 'executive_minimalist') return EXECUTIVE_MINIMALIST_SIGNATURE_TEMPLATE;
  if (layout === 'default') return DEFAULT_SIGNATURE_TEMPLATE;
  if (layout === 'stacked') return STACKED_SIGNATURE_TEMPLATE;
  if (layout === 'corporate') return CORPORATE_SIGNATURE_TEMPLATE;
  if (layout === 'professional') return PROFESSIONAL_SIGNATURE_TEMPLATE;
  if (layout === 'portfolio') return PORTFOLIO_SIGNATURE_TEMPLATE;
  if (layout === 'ecard') return ECARD_SIGNATURE_TEMPLATE;
  if (layout === 'modern_professional') return MODERN_PROFESSIONAL_SIGNATURE_TEMPLATE;
  return STANDARD_SIGNATURE_TEMPLATE;
}

export function renderSignature(input: RenderSignatureInput): string {
  const { profile, template, publicSiteOrigin, utm } = input;
  
  // Clone brand to avoid mutating the original input
  const brand = { ...input.brand };
  brand.contentBlocks = [...(brand.contentBlocks || [])];

  // Forcibly inject Spotlight block if it's a free tier user or if explicitly enabled
  if (input.activeSpotlight && (input.isFreeTier || brand.spotlightEnabled)) {
    const hasSpotlight = brand.contentBlocks.some((b) => b.type === 'spotlight' && b.enabled);
    if (!hasSpotlight) {
      // Remove any disabled spotlight block
      brand.contentBlocks = brand.contentBlocks.filter((b) => b.type !== 'spotlight');
      // Append a fresh spotlight block
      brand.contentBlocks.push({ type: 'spotlight', enabled: true });
    }
  }

  const origin = stripTrailingSlash(
    (publicSiteOrigin ?? DEFAULT_PUBLIC_SITE_ORIGIN).trim() || DEFAULT_PUBLIC_SITE_ORIGIN
  );
  const tmpl = pickTemplate(template.layout);
  const { evalCtx, stringCtx } = mergeRenderContext(
    profile,
    brand,
    template,
    origin,
    input.vcardDownloadUrl,
    input.activeSpotlight
  );
  const afterIf = processConditionals(tmpl, evalCtx);
  let html = substituteVariables(afterIf, stringCtx);

  // Append UTM parameters when configured
  if (utm) {
    html = appendUtmParams(html, utm);
  }

  // Inject Google Fonts stylesheet if applicable
  const primaryFont = (brand.fontFamily || '').split(',')[0].replace(/['"]/g, '').trim();
  const googleFonts = new Set([
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway', 'Nunito', 
    'Work Sans', 'DM Sans', 'Manrope', 'Rubik', 'Outfit', 'Merriweather', 'Playfair Display', 'PT Serif'
  ]);
  
  if (googleFonts.has(primaryFont)) {
    const formattedFontName = primaryFont.replace(/\s+/g, '+');
    const fontLink = `<link href="https://fonts.googleapis.com/css2?family=${formattedFontName}:wght@400;500;600;700&display=swap" rel="stylesheet" />\n`;
    html = fontLink + html;
  }

  return html;
}
