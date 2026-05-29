const CATEGORY_LABELS: Record<string, string> = {
  'email-signatures': 'Email Signatures',
  'email-deliverability': 'Email Deliverability',
  'email-trust': 'Email Trust',
  'team-branding': 'Team Branding',
};

export const BLOG_CATEGORIES = Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>;

const TAG_LABELS: Record<string, string> = {
  spf: 'SPF',
  dkim: 'DKIM',
  dmarc: 'DMARC',
  bimi: 'BIMI',
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getCategoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getTagLabel(slug: string): string {
  return TAG_LABELS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
