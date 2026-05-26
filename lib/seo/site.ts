import { getPublicSiteOrigin } from '@/lib/siteOrigin';

export const SITE_NAME = 'Tailnote';

/** Social / Open Graph image (1200×630 recommended; place under public/). */
export const DEFAULT_OG_IMAGE_PATH = '/images/og/tailnote-og.jpg';

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

/** Warn at build time when production deploy lacks a public site URL. */
export function warnProductionSiteUrl(): void {
  if (process.env.VERCEL_ENV !== 'production') return;
  const url = getSiteUrl();
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    console.warn(
      '[seo] Production build: set NEXT_PUBLIC_APP_URL (or NEXT_PUBLIC_SITE_URL) to your live domain. ' +
        'Sitemap, canonical URLs, and JSON-LD are using localhost.'
    );
  }
}
