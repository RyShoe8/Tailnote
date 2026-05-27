import type { Metadata } from 'next';
import {
  absoluteUrl,
  DEFAULT_DESCRIPTION,
  formatPageTitle,
  getSiteUrl,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
} from '@/lib/seo/site';

export type CreatePageMetadataInput = {
  title: string;
  description: string;
  /** Path including leading slash, e.g. `/pricing` */
  path: string;
  ogType?: 'website' | 'article';
};

/**
 * Explicit OG image entry when a route cannot use the app/opengraph-image file convention.
 * Prefer omitting images so Next.js serves /opengraph-image (1200×630) automatically.
 */
export function defaultOgImageMetadata(): NonNullable<Metadata['openGraph']>['images'] {
  return [
    {
      url: '/opengraph-image',
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      type: 'image/png',
      alt: SITE_TITLE_DEFAULT,
    },
  ];
}

export function createPageMetadata({
  title,
  description,
  path,
  ogType = 'website',
}: CreatePageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const socialTitle = formatPageTitle(title);

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
      title: socialTitle,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
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
      default: SITE_TITLE_DEFAULT,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    icons: {
      icon: [
        { url: '/images/tailnote-icon.png', sizes: '48x48', type: 'image/png' },
        { url: '/images/tailnote-icon.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: '/images/tailnote-icon.png',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
      title: SITE_TITLE_DEFAULT,
      description: DEFAULT_DESCRIPTION,
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_TITLE_DEFAULT,
      description: DEFAULT_DESCRIPTION,
    },
  };
}
