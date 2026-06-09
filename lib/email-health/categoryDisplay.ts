import type { CategoryResult, CheckStatus, EmailHealthCategory } from '@/lib/email-health/types';

export const DISPLAY_CATEGORY_ORDER: EmailHealthCategory[] = [
  'spf',
  'dkim',
  'dmarc',
  'mx',
  'tls',
  'https',
  'bimi',
];

const STATUS_SORT: Record<CheckStatus, number> = {
  pass: 0,
  warn: 1,
  fail: 2,
};

function displayIndex(category: EmailHealthCategory): number {
  const idx = DISPLAY_CATEGORY_ORDER.indexOf(category);
  return idx === -1 ? DISPLAY_CATEGORY_ORDER.length : idx;
}

function compareCategories(a: CategoryResult, b: CategoryResult): number {
  const statusDiff = STATUS_SORT[a.status] - STATUS_SORT[b.status];
  if (statusDiff !== 0) return statusDiff;
  return displayIndex(a.category) - displayIndex(b.category);
}

export function sortCategoriesForDisplay(categories: CategoryResult[]): {
  passing: CategoryResult[];
  needsAttention: CategoryResult[];
} {
  const passing: CategoryResult[] = [];
  const needsAttention: CategoryResult[] = [];

  for (const cat of categories) {
    if (cat.status === 'pass') {
      passing.push(cat);
    } else {
      needsAttention.push(cat);
    }
  }

  passing.sort(compareCategories);
  needsAttention.sort(compareCategories);

  return { passing, needsAttention };
}
