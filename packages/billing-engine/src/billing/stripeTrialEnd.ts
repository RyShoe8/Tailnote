import type Stripe from 'stripe';

export function trialEndsAtFromStripeSubscription(
  sub: Pick<Stripe.Subscription, 'trial_end'>
): Date | undefined {
  if (typeof sub.trial_end !== 'number' || sub.trial_end <= 0) return undefined;
  return new Date(sub.trial_end * 1000);
}
