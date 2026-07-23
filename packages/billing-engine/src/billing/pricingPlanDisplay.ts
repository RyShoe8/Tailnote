import type { PublicPricingPlan } from './getPublicPricingPlans';
import { getBillingContext } from '../context';
import { DEFAULT_PLAN_FEATURE_BULLETS } from './defaultPlanFeatureBullets';
import { isFreemiumPricingPlan } from './planFreemium';

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
  if (isFreemiumPricingPlan(plan)) return 'Free';
  if (plan.interval === 'lifetime') {
    return `${formatUsd(plan.basePriceCents)} one-time`;
  }
  return `${formatUsd(plan.basePriceCents)}${intervalSuffix(plan.interval)}`;
}

export function includedUsersSummary(plan: PublicPricingPlan): string {
  const n = Math.max(1, plan.includedUsers);
  return `${n} user${n === 1 ? '' : 's'} included`;
}

/** Shown under "Per subscription" on plan cards when add-on seats are available. */
export function additionalUsersPricingLine(plan: PublicPricingPlan): string | null {
  if (plan.interval === 'lifetime' || plan.additionalUserPriceCents <= 0) return null;
  return `Add more users anytime for ${formatUsd(plan.additionalUserPriceCents)} per user${intervalSuffix(plan.interval)}`;
}

export function seatPolicyLine(plan: PublicPricingPlan): string | null {
  const addOn = additionalUsersPricingLine(plan);
  if (addOn) return addOn;
  if (plan.interval === 'lifetime') return null;
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

const FREEMIUM_EMAIL_HEALTH_BULLET =
  'Domain email health checker (SPF, DKIM, DMARC, BIMI) in your dashboard';

export function planFeatureBullets(plan: PublicPricingPlan): string[] {
  if (isFreemiumPricingPlan(plan)) {
    return [
      'Core signature generation and copy-paste install (Gmail and Outlook)',
      'All signature layout presets',
      'Promotional content blocks',
      FREEMIUM_EMAIL_HEALTH_BULLET,
      'Powered by Tailnote attribution on signatures',
    ];
  }
  return [...baseFeatureBullets()];
}

export function planExcludedFeatureBullets(plan: PublicPricingPlan): string[] {
  if (!isFreemiumPricingPlan(plan)) return [];
  return [
    'Remove Tailnote branding',
    'Click and open analytics',
    'Dynamic Content',
    'Additional team seats',
    'Signature animation slot',
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
