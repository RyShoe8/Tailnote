import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo/site';

const PRIVATE_DISALLOWS = [
  '/dashboard/',
  '/admin/',
  '/api/',
  '/login',
  '/signup',
  '/onboarding',
  '/invite/',
  '/p/',
] as const;

const LLM_USER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'Bytespider',
  'CCBot',
  'cohere-ai',
  'Amazonbot',
  'meta-externalagent',
] as const;

function crawlerRules(userAgent: string) {
  return {
    userAgent,
    allow: '/',
    disallow: [...PRIVATE_DISALLOWS] as string[],
  };
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  const rules = [
    crawlerRules('*'),
    ...LLM_USER_AGENTS.map((agent) => crawlerRules(agent)),
  ];

  return {
    rules,
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
