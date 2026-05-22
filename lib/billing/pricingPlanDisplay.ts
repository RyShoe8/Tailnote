import type { PublicPricingPlan } from '@/lib/billing/getPublicPricingPlans';
import { CORE_PRODUCT_FEATURE_BULLETS } from '@/lib/marketing/productFeatures';

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function intervalSuffix(interval: PublicPricingPlan['interval']): string {
  switch (interval) {
    case 'month':
      return '/mo';
    case 'year':
      return '/yr';
    case 'lifetime':
      return '';
    default:
      return '';
  }
}

export function primaryPriceLine(plan: PublicPricingPlan): string {
  if (plan.interval === 'lifetime') {
    return `${formatUsd(plan.basePriceCents)} one-time`;
  }
  return `${formatUsd(plan.basePriceCents)}${intervalSuffix(plan.interval)}`;
}

export function includedUsersSummary(plan: PublicPricingPlan): string {
  const n = Math.max(1, plan.includedUsers);
  return `${n} user${n === 1 ? '' : 's'} included`;
}

export function seatPolicyLine(plan: PublicPricingPlan): string | null {
  if (plan.interval === 'lifetime') return null;
  if (plan.additionalUserPriceCents > 0) {
    return `Add more users anytime for ${formatUsd(plan.additionalUserPriceCents)} per user${intervalSuffix(plan.interval)}`;
  }
  return 'No additional seats available on this plan';
}

export function subscriptionCap(
  plan: PublicPricingPlan
): { max: number; remaining: number } | null {
  const max = plan.maxSubscriptionSlots;
  if (max <= 0) return null;
  return { max, remaining: Math.max(0, max - plan.subscriptionCount) };
}

export function planFeatureBullets(plan: PublicPricingPlan): string[] {
  const seats = seatPolicyLine(plan);
  return [...CORE_PRODUCT_FEATURE_BULLETS, ...(seats ? [seats] : [])];
}

export function isRecommendedPlan(plan: PublicPricingPlan): boolean {
  return plan.badge.trim().toLowerCase() === 'popular';
}
