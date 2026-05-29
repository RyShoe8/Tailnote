import type { Metadata } from 'next';
import {
  absoluteUrl,
  formatPageTitle,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE_NAME,
} from '@/lib/seo/site';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';
import type { BlogPostMeta } from '@/lib/blog/types';
import { getCategoryLabel, getTagLabel } from '@/lib/blog/categories';

export function createBlogIndexMetadata(): Metadata {
  const title = 'Blog';
  const description =
    'Guides on email signatures, SPF, DKIM, DMARC, BIMI, deliverability, and branded outbound email for solo founders and SMB teams.';
  const path = '/blog';

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      title: formatPageTitle(title),
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: formatPageTitle(title),
      description,
    },
  };
}

export function createBlogPostMetadata(post: BlogPostMeta): Metadata {
  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.description;
  const path = `/blog/${post.slug}`;
  const canonical = post.canonicalUrl ?? absoluteUrl(path);
  const publishedTime = new Date(post.publishedAt).toISOString();
  const modifiedTime = post.updatedAt
    ? new Date(post.updatedAt).toISOString()
    : publishedTime;

  const images = post.coverImage
    ? [
        {
          url: post.coverImage.startsWith('http')
            ? post.coverImage
            : absoluteUrl(post.coverImage),
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: post.title,
        },
      ]
    : undefined;

  if (post.isDraft && process.env.NODE_ENV === 'production') {
    return {
      ...NOINDEX_METADATA,
      title,
      description,
    };
  }

  return {
    title,
    description,
    alternates: { canonical },
    robots: post.isDraft ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: 'article',
      locale: 'en_US',
      url: canonical,
      siteName: SITE_NAME,
      title: formatPageTitle(title),
      description,
      publishedTime,
      modifiedTime,
      tags: post.tags,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: formatPageTitle(title),
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}

export function createBlogCategoryMetadata(category: string, postCount: number): Metadata {
  const label = getCategoryLabel(category);
  const title = `${label} articles`;
  const description = `${postCount} article${postCount === 1 ? '' : 's'} about ${label.toLowerCase()} — email signatures, deliverability, and team branding from Tailnote.`;
  const path = `/blog/category/${category}`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      title: formatPageTitle(title),
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: formatPageTitle(title),
      description,
    },
  };
}

export function createBlogTagMetadata(tag: string, postCount: number): Metadata {
  const label = getTagLabel(tag);
  const title = `${label} guides`;
  const description = `${postCount} Tailnote blog article${postCount === 1 ? '' : 's'} tagged ${label} — practical email and branding advice for small teams.`;
  const path = `/blog/tag/${tag}`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      title: formatPageTitle(title),
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: formatPageTitle(title),
      description,
    },
  };
}
