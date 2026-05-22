import type { Metadata } from 'next';
import { absoluteOgImageUrl, absoluteUrl, getSiteUrl, SITE_NAME } from '@/lib/seo/site';

export type CreatePageMetadataInput = {
  title: string;
  description: string;
  /** Path including leading slash, e.g. `/pricing` */
  path: string;
  ogType?: 'website' | 'article';
};

export function createPageMetadata({
  title,
  description,
  path,
  ogType = 'website',
}: CreatePageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: ogType,
      locale: 'en_US',
      url: canonical,
      siteName: SITE_NAME,
      title: `${title} — ${SITE_NAME}`,
      description,
      images: [
        {
          url: absoluteOgImageUrl(),
          alt: `${SITE_NAME} logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — ${SITE_NAME}`,
      description,
      images: [absoluteOgImageUrl()],
    },
  };
}

export const NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: false },
};

/** Root layout defaults — call from app/layout.tsx */
export function rootLayoutMetadata(): Metadata {
  const metadataBase = new URL(getSiteUrl());

  return {
    metadataBase,
    title: {
      default: SITE_NAME,
      template: `%s — ${SITE_NAME}`,
    },
    description:
      'Professional email signatures for modern teams — promotional blocks, UTM tracking, and polished templates.',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
      images: [{ url: absoluteOgImageUrl(), alt: `${SITE_NAME} logo` }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [absoluteOgImageUrl()],
    },
  };
}
