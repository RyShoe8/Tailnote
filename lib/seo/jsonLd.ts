import { absoluteOgImageUrl, absoluteUrl, getSiteUrl, SITE_NAME } from '@/lib/seo/site';

type JsonLd = Record<string, unknown>;

export type PricingPlanForSchema = {
  id: string;
  name: string;
  description: string;
  slug: string;
  interval: 'month' | 'year' | 'lifetime';
  basePriceCents: number;
  soldOut: boolean;
};

function baseContext(): JsonLd {
  return { '@context': 'https://schema.org' };
}

export function organizationJsonLd(): JsonLd {
  return {
    ...baseContext(),
    '@type': 'Organization',
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteOgImageUrl(),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: absoluteUrl('/contact'),
    },
  };
}

export function webSiteJsonLd(): JsonLd {
  return {
    ...baseContext(),
    '@type': 'WebSite',
    name: SITE_NAME,
    url: getSiteUrl(),
    description:
      'Email signature software for teams — promotional blocks, UTM tracking, and templates for Gmail and Outlook.',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: getSiteUrl(),
    },
  };
}

export function webPageJsonLd(input: {
  path: string;
  name: string;
  description: string;
  dateModified?: string;
}): JsonLd {
  const url = absoluteUrl(input.path);
  return {
    ...baseContext(),
    '@type': 'WebPage',
    '@id': url,
    url,
    name: input.name,
    description: input.description,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: getSiteUrl() },
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
  };
}

export function aboutPageJsonLd(input: {
  path: string;
  name: string;
  description: string;
}): JsonLd {
  const url = absoluteUrl(input.path);
  return {
    ...baseContext(),
    '@type': 'AboutPage',
    '@id': url,
    url,
    name: input.name,
    description: input.description,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: getSiteUrl() },
  };
}

export function contactPageJsonLd(input: {
  path: string;
  name: string;
  description: string;
}): JsonLd {
  const url = absoluteUrl(input.path);
  return {
    ...baseContext(),
    '@type': 'ContactPage',
    '@id': url,
    url,
    name: input.name,
    description: input.description,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: getSiteUrl() },
  };
}

export function softwareApplicationJsonLd(): JsonLd {
  return {
    ...baseContext(),
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: getSiteUrl(),
    description:
      'SaaS platform for team email signatures with promotional content blocks, UTM tracking, templates, and Gmail integration.',
    offers: {
      '@type': 'Offer',
      url: absoluteUrl('/pricing'),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };
}

export function faqPageJsonLd(
  faqs: ReadonlyArray<{ readonly q: string; readonly a: string }>
): JsonLd {
  return {
    ...baseContext(),
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

export function itemListJsonLd(
  items: { name: string; description?: string; url?: string }[]
): JsonLd {
  return {
    ...baseContext(),
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        ...(item.url ? { url: item.url } : {}),
      },
    })),
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]): JsonLd {
  return {
    ...baseContext(),
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** Home → current page breadcrumb for inner marketing routes. */
export function marketingBreadcrumbJsonLd(pageTitle: string, path: string): JsonLd {
  return breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: pageTitle, path },
  ]);
}

function pricingOfferBillingDuration(interval: PricingPlanForSchema['interval']): string | undefined {
  if (interval === 'month') return 'P1M';
  if (interval === 'year') return 'P1Y';
  return undefined;
}

export function pricingPlansJsonLd(plans: PricingPlanForSchema[]): JsonLd {
  return {
    ...baseContext(),
    '@type': 'ItemList',
    name: `${SITE_NAME} pricing plans`,
    itemListElement: plans.map((plan, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: plan.name,
        description: plan.description,
        sku: plan.slug,
        offers: {
          '@type': 'Offer',
          url: absoluteUrl(`/signup?subscriptionPlanId=${encodeURIComponent(plan.id)}`),
          price: (plan.basePriceCents / 100).toFixed(2),
          priceCurrency: 'USD',
          availability: plan.soldOut
            ? 'https://schema.org/SoldOut'
            : 'https://schema.org/InStock',
          ...(plan.interval === 'lifetime'
            ? { category: 'Lifetime (one-time purchase)' }
            : { priceSpecification: { billingDuration: pricingOfferBillingDuration(plan.interval) } }),
        },
      },
    })),
  };
}
