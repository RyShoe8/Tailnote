import { getPublicSiteOrigin } from '@/lib/siteOrigin';

export const SITE_NAME = 'Tailnote';

export const DEFAULT_OG_IMAGE_PATH = '/images/tailnote-logo.png';

export const DEFAULT_DESCRIPTION =
  'Professional email signatures for modern teams — promotional blocks, UTM tracking, and polished templates for Gmail and Outlook.';

/** Canonical site origin for metadata, sitemap, and JSON-LD. */
export function getSiteUrl(): string {
  return getPublicSiteOrigin() ?? 'http://localhost:3000';
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function absoluteOgImageUrl(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE_PATH);
}
