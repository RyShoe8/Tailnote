import {
  getOrganizationPlanTier,
  hasAnalytics,
  hasBrandingRemoval,
  isActiveSubscriptionStatus,
  isFreePlan,
  isOrganizationPaid,
  isPaidPlan,
  mapSubscriptionStatus,
  organizationPlanForStripeStatus,
} from '../lib/billing/subscriptionAccess';
import { isFreemiumSubscriptionPlan } from 'billing-engine';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const procEnv = process.env as Record<string, string | undefined>;
const prevNodeEnv = procEnv.NODE_ENV;
const prevStripeKey = procEnv.STRIPE_SECRET_KEY;

function withEnv(
  patch: { NODE_ENV?: string; STRIPE_SECRET_KEY?: string },
  fn: () => void
) {
  if (patch.NODE_ENV !== undefined) procEnv.NODE_ENV = patch.NODE_ENV;
  if (patch.STRIPE_SECRET_KEY !== undefined) {
    if (patch.STRIPE_SECRET_KEY) procEnv.STRIPE_SECRET_KEY = patch.STRIPE_SECRET_KEY;
    else delete procEnv.STRIPE_SECRET_KEY;
  }
  try {
    fn();
  } finally {
    if (prevNodeEnv === undefined) delete procEnv.NODE_ENV;
    else procEnv.NODE_ENV = prevNodeEnv;
    if (prevStripeKey === undefined) delete procEnv.STRIPE_SECRET_KEY;
    else procEnv.STRIPE_SECRET_KEY = prevStripeKey;
  }
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

withEnv({ NODE_ENV: 'production', STRIPE_SECRET_KEY: '' }, () => {
  const inactivePro = { plan: 'pro', subscriptionStatus: 'none' as const };
  assert(!isOrganizationPaid(inactivePro), 'production without Stripe: inactive pro not paid');
  assert(isFreePlan(inactivePro), 'production without Stripe: inactive pro is free tier');
  assert(!hasAnalytics(inactivePro), 'production without Stripe: no analytics');
  assert(!hasBrandingRemoval(inactivePro), 'production without Stripe: no branding removal');
  assert(
    getOrganizationPlanTier(inactivePro) === 'free',
    'production without Stripe: tier from status not slug'
  );

  const activePro = { plan: 'pro', subscriptionStatus: 'active' as const };
  assert(isOrganizationPaid(activePro), 'production without Stripe: active still paid');
  assert(isPaidPlan(activePro), 'production without Stripe: active is paid plan');

  const friendsActive = { plan: 'friends-family', subscriptionStatus: 'active' as const };
  assert(isPaidPlan(friendsActive), 'friends-family active is paid');
  assert(hasBrandingRemoval(friendsActive), 'friends-family active has branding removal');
  assert(hasAnalytics(friendsActive), 'friends-family active has analytics');
  assert(
    getOrganizationPlanTier(friendsActive) === 'team',
    'friends-family active maps to team tier'
  );

  const friendsInactive = { plan: 'friends-family', subscriptionStatus: 'none' as const };
  assert(isFreePlan(friendsInactive), 'lapsed friends-family is freemium tier');
  assert(!hasBrandingRemoval(friendsInactive), 'lapsed friends-family has no branding removal');
});

assert(
  !isFreemiumSubscriptionPlan({ slug: 'friends-family', isFreemium: false }),
  'complimentary $0 plan is not freemium'
);
assert(
  isFreemiumSubscriptionPlan({ slug: 'friends-family', isFreemium: true }),
  'explicit isFreemium flag'
);
assert(
  isFreemiumSubscriptionPlan({ slug: 'free', isFreemium: false }),
  'slug free back-compat'
);

withEnv({ NODE_ENV: 'development', STRIPE_SECRET_KEY: '' }, () => {
  const inactivePro = { plan: 'pro', subscriptionStatus: 'none' as const };
  assert(isOrganizationPaid(inactivePro), 'dev without Stripe: permissive paid bypass');
  assert(
    getOrganizationPlanTier(inactivePro) === 'team',
    'dev without Stripe: tier from slug'
  );
});

console.log('subscription-access-smoke: all checks passed.');
