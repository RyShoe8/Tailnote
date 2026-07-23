import type { MetadataRoute } from 'next';
import {
  EMAIL_HEALTH_PAGE_DESCRIPTION,
  EMAIL_HEALTH_PAGE_TITLE,
} from '@/lib/email-health/seoCopy';
import { LEGAL_LAST_UPDATED } from '@/lib/marketing/legalContent';
import { absoluteUrl, SITE_TAGLINE } from '@/lib/seo/site';

export type MarketingPageKey =
  | 'home'
  | 'pricing'
  | 'signatures'
  | 'fromSignature'
  | 'promotionalBlocks'
  | 'analytics'
  | 'emailHealth'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms';

export type MarketingPageConfig = {
  key: MarketingPageKey;
  path: string;
  /** Page title without site suffix (root layout adds " | Tailnote" via template). */
  title: string;
  description: string;
};

export const INDEXABLE_MARKETING_PAGES: readonly MarketingPageConfig[] = [
  {
    key: 'home',
    path: '/',
    title: SITE_TAGLINE,
    description:
      `${SITE_TAGLINE}. Promotional content blocks including Dynamic Content, built-in UTM tracking, click and open analytics, and polished email signatures for Gmail and Outlook.`,
  },
  {
    key: 'pricing',
    path: '/pricing',
    title: 'Email signature pricing',
    description:
      'Free plan for core signatures with Tailnote branding, plus paid plans with branding removal, team seats, Dynamic Content, promotional blocks, UTM tracking, and click and open analytics.',
  },
  {
    key: 'signatures',
    path: '/signatures',
    title: 'Email signatures for teams',
    description:
      'Curated professional email signatures with built-in promotional blocks — book-a-call buttons, offer lists, Dynamic Content, image banners, and a quote library that work in Gmail and Outlook.',
  },
  {
    key: 'fromSignature',
    path: '/from-signature',
    title: 'Email signatures by Tailnote',
    description:
      'You found Tailnote from a signature link. Learn why free plans include attribution, what paid plans unlock, and how to create your own professional email signature.',
  },
  {
    key: 'promotionalBlocks',
    path: '/promotional-blocks',
    title: 'Promotional blocks for email signatures',
    description:
      'Add book-a-call buttons, offer lists, Dynamic Content, promo banners, and quotes from the Tailnote library to every employee email. Organization-wide updates with built-in UTM tracking.',
  },
  {
    key: 'analytics',
    path: '/analytics',
    title: 'Email signature click and open analytics',
    description:
      'Track signature link clicks and optional opens by day and team member. Break down engagement by link type and see activity over time, with UTM support for Google Analytics.',
  },
  {
    key: 'emailHealth',
    path: '/email-health',
    title: EMAIL_HEALTH_PAGE_TITLE,
    description: EMAIL_HEALTH_PAGE_DESCRIPTION,
  },
  {
    key: 'about',
    path: '/about',
    title: 'About Us',
    description:
      'Tailnote helps teams create, manage, and deploy professional email signatures with consistent branding, signature layouts, and copy-paste install for Gmail and Outlook.',
  },
  {
    key: 'contact',
    path: '/contact',
    title: 'Contact us',
    description:
      'Get in touch with the Tailnote team. We reply at the email you provide — usually within one business day.',
  },
  {
    key: 'privacy',
    path: '/privacy',
    title: 'Privacy Policy',
    description:
      'How Tailnote collects, uses, and protects your data when you use our email signature platform.',
  },
  {
    key: 'terms',
    path: '/terms',
    title: 'Terms and Conditions',
    description:
      'Terms of service for using Tailnote — subscriptions, Lifetime plans, acceptable use, and your rights as a customer.',
  },
] as const;

export function marketingPageByKey(key: MarketingPageKey): MarketingPageConfig {
  const page = INDEXABLE_MARKETING_PAGES.find((p) => p.key === key);
  if (!page) throw new Error(`Unknown marketing page: ${key}`);
  return page;
}

const LEGAL_PAGE_PATHS = new Set(['/privacy', '/terms']);

function legalLastModified(): Date {
  return new Date(LEGAL_LAST_UPDATED);
}

/** Sitemap rows for indexable marketing pages with per-page lastModified. */
export function marketingSitemapEntries(): MetadataRoute.Sitemap {
  const defaultLastModified = new Date();

  return INDEXABLE_MARKETING_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: LEGAL_PAGE_PATHS.has(page.path) ? legalLastModified() : defaultLastModified,
    changeFrequency: page.path === '/' ? ('weekly' as const) : ('monthly' as const),
    priority: page.path === '/' ? 1 : page.path === '/email-health' ? 0.9 : 0.8,
  }));
}
