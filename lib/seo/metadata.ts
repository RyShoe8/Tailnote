import type { Metadata } from 'next';
import {
  absoluteOgImageUrl,
  absoluteUrl,
  DEFAULT_DESCRIPTION,
  formatPageTitle,
  getSiteUrl,
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

const ogImage = {
  url: absoluteOgImageUrl(),
  width: 1200,
  height: 630,
  alt: SITE_TITLE_DEFAULT,
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
      title: formatPageTitle(title),
      description,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: formatPageTitle(title),
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
      description: DEFAULT_DESCRIPTION,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      images: [absoluteOgImageUrl()],
    },
  };
}
