import {
  isActiveSubscriptionStatus,
  isOrganizationPaid,
  mapSubscriptionStatus,
  organizationPlanForStripeStatus,
} from '../lib/billing/subscriptionAccess';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(isActiveSubscriptionStatus('active'), 'active');
assert(isActiveSubscriptionStatus('trialing'), 'trialing');
assert(!isActiveSubscriptionStatus('past_due'), 'past_due');
assert(!isActiveSubscriptionStatus('canceled'), 'canceled');

assert(organizationPlanForStripeStatus('active') === 'pro', 'plan active');
assert(organizationPlanForStripeStatus('past_due') === 'none', 'plan past_due');
assert(organizationPlanForStripeStatus('canceled') === 'none', 'plan canceled');

assert(mapSubscriptionStatus('past_due') === 'past_due', 'map past_due');
assert(mapSubscriptionStatus('unpaid') === 'canceled', 'map unpaid');

assert(
  isOrganizationPaid({ subscriptionStatus: 'active' }),
  'paid when active and stripe env assumed in CI may vary'
);

console.log('subscription-access-smoke: all checks passed.');
