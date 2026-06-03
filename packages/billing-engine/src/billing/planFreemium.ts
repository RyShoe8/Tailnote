import type { PublicPricingPlan } from './getPublicPricingPlans';
import type { SubscriptionPlanDoc } from '../models/SubscriptionPlan';

type PlanSlugFreemium = Pick<SubscriptionPlanDoc, 'slug' | 'isFreemium'>;

/** Canonical freemium tier (product restrictions). Not the same as $0 price. */
export function isFreemiumSubscriptionPlan(plan: PlanSlugFreemium): boolean {
  if (plan.isFreemium === true) return true;
  return String(plan.slug ?? '').trim().toLowerCase() === 'free';
}

export function isFreemiumPricingPlan(
  plan: Pick<PublicPricingPlan, 'slug' | 'isFreemium'>
): boolean {
  if (plan.isFreemium === true) return true;
  return plan.slug.trim().toLowerCase() === 'free';
}

/** $0 plan that grants premium entitlements (e.g. friends & family). */
export function isComplimentaryZeroPricePlan(
  plan: Pick<SubscriptionPlanDoc, 'slug' | 'isFreemium' | 'basePriceCents'>
): boolean {
  return !isFreemiumSubscriptionPlan(plan) && Number(plan.basePriceCents ?? 0) === 0;
}

/** Skip Stripe checkout; assign plan directly (freemium or complimentary $0). */
export function shouldAssignPlanWithoutCheckout(
  plan: Pick<SubscriptionPlanDoc, 'slug' | 'isFreemium' | 'basePriceCents' | 'stripeBasePriceId'>
): boolean {
  if (isFreemiumSubscriptionPlan(plan)) return true;
  if (isComplimentaryZeroPricePlan(plan) && !String(plan.stripeBasePriceId ?? '').trim()) {
    return true;
  }
  return false;
}
