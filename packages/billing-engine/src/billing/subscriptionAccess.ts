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

/** Dev-only bypass when Stripe is not configured; production always enforces subscription status. */
function stripeDevBypass(): boolean {
  return !stripeBillingEnabled() && process.env.NODE_ENV !== 'production';
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
  if (stripeDevBypass()) return true;
  return isActiveSubscriptionStatus(org.subscriptionStatus);
}

/** Intentional free-tier org (freemium signup); not an abandoned paid checkout. */
export function isFreemiumOrganization(
  org: { plan?: string | null } | null | undefined
): boolean {
  return normalizePlanSlug(org?.plan) === 'free';
}

/**
 * Full dashboard/product access: paid (active/trialing) or freemium.
 * Incomplete unpaid checkouts must not get platform access.
 */
export function hasDashboardAccess(org: PlanLike | null | undefined): boolean {
  if (!org) return false;
  if (stripeDevBypass()) return true;
  if (isOrganizationPaid(org)) return true;
  return isFreemiumOrganization(org);
}

export type DashboardAccessRedirect = '/onboarding' | '/dashboard/billing';

/**
 * Where to send a user who is signed in with an org but lacks full dashboard access.
 * Returns null when the current pathname is already allowed (or access is granted).
 */
export function getDashboardAccessRedirect(
  org: PlanLike | null | undefined,
  pathname: string | null | undefined
): DashboardAccessRedirect | null {
  if (hasDashboardAccess(org)) return null;

  const path = (pathname || '').split('?')[0] || '';
  const status = String(org?.subscriptionStatus ?? 'none');

  if (status === 'past_due' || status === 'canceled') {
    if (path === '/dashboard/billing' || path.startsWith('/dashboard/billing/')) {
      return null;
    }
    return '/dashboard/billing';
  }

  // incomplete, none (non-freemium), and any other unpaid state
  if (path === '/onboarding' || path.startsWith('/onboarding/')) {
    return null;
  }
  return '/onboarding';
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
  const slug = normalizePlanSlug(org.plan);
  if (slug === 'free') return 'free';
  if (stripeDevBypass()) {
    if (slug === 'team' || slug === 'pro') return 'team';
    if (slug === 'solo' || slug === 'basic') return 'solo';
    return 'team';
  }
  if (!isOrganizationPaid(org)) return 'free';
  if (slug === 'team' || slug === 'pro') return 'team';
  if (slug === 'solo' || slug === 'basic') return 'solo';
  return 'team';
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
