import type { PublicPricingPlan } from './getPublicPricingPlans';
import { getBillingContext } from '../context';
import { DEFAULT_PLAN_FEATURE_BULLETS } from './defaultPlanFeatureBullets';

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

function isFreePricingPlan(plan: PublicPricingPlan): boolean {
  return plan.slug.trim().toLowerCase() === 'free' || plan.basePriceCents === 0;
}

export function primaryPriceLine(plan: PublicPricingPlan): string {
  if (isFreePricingPlan(plan)) return 'Free';
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

function baseFeatureBullets(): readonly string[] {
  try {
    const custom = getBillingContext().billing.planFeatureBullets;
    if (custom?.length) return custom;
  } catch {
    /* context not set — use defaults */
  }
  return DEFAULT_PLAN_FEATURE_BULLETS;
}

export function planFeatureBullets(plan: PublicPricingPlan): string[] {
  if (isFreePricingPlan(plan)) {
    return [
      'Core signature generation and copy-paste install (Gmail and Outlook)',
      'Layout presets (up to 4)',
      'Promotional content blocks',
      'Powered by Tailnote attribution on signatures',
    ];
  }
  const seats = seatPolicyLine(plan);
  return [...baseFeatureBullets(), ...(seats ? [seats] : [])];
}

export function planExcludedFeatureBullets(plan: PublicPricingPlan): string[] {
  if (!isFreePricingPlan(plan)) return [];
  return [
    'Remove Tailnote branding',
    'Click and open analytics',
    'Additional team seats',
    'Signature animation slot and full preset library',
  ];
}

export function isRecommendedPlan(plan: PublicPricingPlan): boolean {
  return plan.badge.trim().toLowerCase() === 'popular';
}

export function trialSummaryLine(plan: PublicPricingPlan): string | null {
  if (plan.interval === 'lifetime' || plan.trialDays <= 0) return null;
  const n = plan.trialDays;
  return `${n}-day free trial`;
}
