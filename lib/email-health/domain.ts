const HOSTNAME_RE =
  /^(?=.{1,253}$)(?!-)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.(?!-)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

export class DomainValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainValidationError';
  }
}

export function domainToSlug(domain: string): string {
  return domain.toLowerCase().replace(/\./g, '-');
}

export function slugToDomain(slug: string): string {
  return slug.toLowerCase().replace(/-/g, '.');
}

/** Normalize user input to a bare hostname (no protocol, path, or trailing dot). */
export function normalizeDomainInput(raw: string): string {
  let value = raw.trim().toLowerCase();
  if (!value) throw new DomainValidationError('Enter a domain name to scan.');

  value = value.replace(/^https?:\/\//, '');
  value = value.split('/')[0] ?? value;
  value = value.split('?')[0] ?? value;
  value = value.split('#')[0] ?? value;
  value = value.replace(/:\d+$/, '');
  value = value.replace(/\.$/, '');
  value = value.replace(/^www\./, '');

  return value;
}

export function validateDomain(domain: string): void {
  if (domain.length > 253) {
    throw new DomainValidationError('Domain name is too long.');
  }
  if (IPV4_RE.test(domain) || domain.includes(':')) {
    throw new DomainValidationError('Enter a domain name, not an IP address.');
  }
  if (domain === 'localhost' || domain.endsWith('.local')) {
    throw new DomainValidationError('That domain cannot be scanned.');
  }
  if (!HOSTNAME_RE.test(domain)) {
    throw new DomainValidationError('Enter a valid domain like example.com.');
  }
}

export function parseDomainInput(raw: string): { domain: string; domainSlug: string } {
  const domain = normalizeDomainInput(raw);
  validateDomain(domain);
  return { domain, domainSlug: domainToSlug(domain) };
}
