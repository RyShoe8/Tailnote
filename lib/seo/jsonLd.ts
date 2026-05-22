import { absoluteOgImageUrl, absoluteUrl, getSiteUrl, SITE_NAME } from '@/lib/seo/site';
import type { HOME_FAQS } from '@/lib/seo/homeFaq';

type JsonLd = Record<string, unknown>;

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

export function faqPageJsonLd(faqs: typeof HOME_FAQS): JsonLd {
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
