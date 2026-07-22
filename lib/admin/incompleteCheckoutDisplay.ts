/**
 * Admin display helpers for orgs that started Stripe Checkout but never paid.
 *
 * Expected DB state after onboarding creates a Checkout Session that stays
 * open/unpaid (e.g. org 6a573f0efdd79d7c9394712b / tanner@hello134.com):
 * - Organization.plan = 'none'
 * - Organization.subscriptionStatus = 'incomplete'
 * - Organization.stripeSubscriptionId = '' (empty)
 * - OrganizationSubscription.subscriptionPlanId = chosen paid plan (e.g. Solo Yearly)
 * - OrganizationSubscription.status = 'incomplete'
 * - Stripe: Checkout Session status "open", payment_status "unpaid", no invoice/subscription
 *
 * That is an abandoned checkout, not a successful paid signup. Admin UI must not
 * present the pinned plan name as a live subscription.
 */

export type IncompleteCheckoutDisplayInput = {
  subscriptionStatus: string;
  /** Pinned SubscriptionPlan id, if any */
  subscriptionPlanId?: string | null;
  /** Stripe subscription id on Organization (or org-sub), if any */
  stripeSubscriptionId?: string | null;
};

export function isIncompleteCheckoutDisplay(input: IncompleteCheckoutDisplayInput): boolean {
  if (input.subscriptionStatus !== 'incomplete') return false;
  if (!String(input.subscriptionPlanId ?? '').trim()) return false;
  if (String(input.stripeSubscriptionId ?? '').trim()) return false;
  return true;
}

/** Human status line under the plan editor (distinct from a live `active` sub). */
export function formatAdminSubscriptionStatusLabel(input: IncompleteCheckoutDisplayInput): string {
  if (isIncompleteCheckoutDisplay(input)) {
    return 'incomplete · checkout incomplete';
  }
  return input.subscriptionStatus || 'none';
}

/**
 * Plan column / display name. Appends a suffix so pinned Solo Yearly (etc.)
 * does not look like a completed paid subscription.
 */
export function formatAdminPlanDisplayName(
  baseLabel: string,
  input: IncompleteCheckoutDisplayInput,
): string {
  if (!baseLabel || baseLabel === 'None') return baseLabel || 'None';
  if (isIncompleteCheckoutDisplay(input)) {
    return `${baseLabel} · checkout incomplete`;
  }
  return baseLabel;
}
