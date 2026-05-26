import type { MetadataRoute } from 'next';
import { LEGAL_LAST_UPDATED } from '@/lib/marketing/legalContent';
import { absoluteUrl } from '@/lib/seo/site';

export type MarketingPageKey =
  | 'home'
  | 'pricing'
  | 'templates'
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
  /** Page title without site suffix (root layout adds " — Tailnote" via template). */
  title: string;
  description: string;
};

export const INDEXABLE_MARKETING_PAGES: readonly MarketingPageConfig[] = [
  {
    key: 'home',
    path: '/',
    title: 'Email signatures that market your business',
    description:
      'Turn every employee email into a marketing touchpoint with promotional content blocks, built-in UTM tracking, and polished signature templates for Gmail and Outlook.',
  },
  {
    key: 'pricing',
    path: '/pricing',
    title: 'Email signature pricing',
    description:
      'Simple per-organization plans with included users, monthly and annual subscriptions, optional Lifetime one-time plans, promotional signature blocks, UTM tracking, and click analytics.',
  },
  {
    key: 'templates',
    path: '/templates',
    title: 'Email signature templates',
    description:
      'Curated email signature templates with built-in promotional blocks — book-a-call buttons, offer lists, blog feeds, and image banners that work in real inboxes.',
  },
  {
    key: 'promotionalBlocks',
    path: '/promotional-blocks',
    title: 'Promotional blocks for email signatures',
    description:
      'Add book-a-call buttons, offer lists, blog feeds, and promo banners to every employee email. Organization-wide updates with built-in UTM tracking.',
  },
  {
    key: 'analytics',
    path: '/analytics',
    title: 'Email signature click analytics',
    description:
      'Track signature link clicks by day, team member, and link type. See which promotional blocks and CTAs drive engagement, with UTM support for Google Analytics.',
  },
  {
    key: 'emailHealth',
    path: '/email-health',
    title: 'Free email health check',
    description:
      'Free domain email health scan — SPF, DKIM, DMARC, BIMI, MX, and TLS explained in plain English with an actionable trust score.',
  },
  {
    key: 'about',
    path: '/about',
    title: 'About Us',
    description:
      'Tailnote helps teams create, manage, and deploy professional email signatures with consistent branding, templates, and optional Gmail integration.',
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
