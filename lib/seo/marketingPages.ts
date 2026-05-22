export type MarketingPageKey =
  | 'home'
  | 'pricing'
  | 'templates'
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
      'Simple per-organization plans with included users, promotional signature blocks, UTM link tracking, and click analytics. Compare Tailnote pricing.',
  },
  {
    key: 'templates',
    path: '/templates',
    title: 'Email signature templates',
    description:
      'Curated email signature templates with built-in promotional blocks — book-a-call buttons, offer lists, blog feeds, and image banners that work in real inboxes.',
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
      'Terms of service for using Tailnote — subscriptions, acceptable use, and your rights as a customer.',
  },
] as const;

export function marketingPageByKey(key: MarketingPageKey): MarketingPageConfig {
  const page = INDEXABLE_MARKETING_PAGES.find((p) => p.key === key);
  if (!page) throw new Error(`Unknown marketing page: ${key}`);
  return page;
}
