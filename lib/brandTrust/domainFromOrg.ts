import { parseDomainInput } from '@/lib/email-health/domain';

/** Extract registrable domain from org website URL for brand-trust scans. */
export function domainFromOrgWebsite(website: string | undefined | null): string | null {
  const raw = String(website ?? '').trim();
  if (!raw) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const host = new URL(withProtocol).hostname.replace(/^www\./i, '');
    if (!host || !host.includes('.')) return null;
    return parseDomainInput(host).domain;
  } catch {
    try {
      return parseDomainInput(raw.replace(/^www\./i, '')).domain;
    } catch {
      return null;
    }
  }
}

export function buildBimiSuggestedRecord(logoUrl: string): string {
  return `v=BIMI1; l=${logoUrl.trim()};`;
}
