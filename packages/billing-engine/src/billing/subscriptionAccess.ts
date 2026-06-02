import type Stripe from 'stripe';
import type { OrganizationBillingFields } from '../types';

export type OrganizationSubscriptionStatus = NonNullable<
  OrganizationBillingFields['subscriptionStatus']
>;

export type OrganizationPlanTier = 'free' | 'solo' | 'team';

type PlanLike = {
  plan?: string | null;
  subscriptionStatus?: string | null;
};

export function stripeBillingEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isActiveSubscriptionStatus(
  status: OrganizationSubscriptionStatus | string | null | undefined
): boolean {
  return status === 'active' || status === 'trialing';
}

export function isOrganizationPaid(
  org: { subscriptionStatus?: string | null } | null | undefined
): boolean {
  if (!org) return false;
  if (!stripeBillingEnabled()) return true;
  return isActiveSubscriptionStatus(org.subscriptionStatus);
}

function normalizePlanSlug(plan: string | null | undefined): string {
  return (plan || '').trim().toLowerCase();
}

export function planTierFromPlanSlug(plan: string | null | undefined): OrganizationPlanTier {
  const slug = normalizePlanSlug(plan);
  if (slug === 'team' || slug === 'pro') return 'team';
  if (slug === 'solo' || slug === 'basic') return 'solo';
  return 'free';
}

export function getOrganizationPlanTier(org: PlanLike | null | undefined): OrganizationPlanTier {
  if (!org) return 'free';
  const tierFromSlug = planTierFromPlanSlug(org.plan);
  if (tierFromSlug === 'free') return 'free';
  if (!stripeBillingEnabled()) return tierFromSlug;
  return isOrganizationPaid(org) ? tierFromSlug : 'free';
}

export function isFreePlan(org: PlanLike | null | undefined): boolean {
  return getOrganizationPlanTier(org) === 'free';
}

export function isPaidPlan(org: PlanLike | null | undefined): boolean {
  return !isFreePlan(org);
}

export function hasAnalytics(org: PlanLike | null | undefined): boolean {
  return isPaidPlan(org);
}

export function hasBrandingRemoval(org: PlanLike | null | undefined): boolean {
  return isPaidPlan(org);
}

/** Legacy org.plan slug from Stripe subscription status (paid statuses only). */
export function organizationPlanForStripeStatus(status: Stripe.Subscription.Status): string {
  if (status === 'active' || status === 'trialing') return 'pro';
  return 'none';
}

export function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): OrganizationSubscriptionStatus | 'none' {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'canceled';
    default:
      return 'incomplete';
  }
}

export function mapOrgSubStatus(
  status: Stripe.Subscription.Status
): 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'canceled';
    default:
      return 'incomplete';
  }
}

export type OrganizationSubscriptionAccess = {
  isPaid: boolean;
  canServeSignatures: boolean;
  canExportSignatures: boolean;
};

export function getOrganizationSubscriptionAccess(
  org: Pick<OrganizationBillingFields, 'plan' | 'subscriptionStatus'> | null | undefined
): OrganizationSubscriptionAccess {
  const isPaid = isPaidPlan(org);
  const hasOrg = Boolean(org);
  return {
    isPaid,
    canServeSignatures: hasOrg,
    canExportSignatures: hasOrg,
  };
}
