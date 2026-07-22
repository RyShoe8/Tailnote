import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import {
  getDashboardAccessRedirect,
  hasDashboardAccess,
  isFreemiumOrganization,
  isOrganizationPaid,
} from './subscriptionAccess';

describe('dashboard access gating', () => {
  let prevStripeKey: string | undefined;

  before(() => {
    prevStripeKey = process.env.STRIPE_SECRET_KEY;
    // Ensure production-like enforcement (no stripeDevBypass).
    process.env.STRIPE_SECRET_KEY = 'sk_test_dashboard_access';
  });

  after(() => {
    if (prevStripeKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = prevStripeKey;
  });

  it('treats freemium plan as freemium org', () => {
    assert.equal(isFreemiumOrganization({ plan: 'free' }), true);
    assert.equal(isFreemiumOrganization({ plan: 'none' }), false);
    assert.equal(isFreemiumOrganization({ plan: 'solo' }), false);
  });

  it('allows active and trialing', () => {
    assert.equal(hasDashboardAccess({ plan: 'solo', subscriptionStatus: 'active' }), true);
    assert.equal(hasDashboardAccess({ plan: 'solo', subscriptionStatus: 'trialing' }), true);
    assert.equal(isOrganizationPaid({ subscriptionStatus: 'active' }), true);
  });

  it('allows freemium without Stripe payment', () => {
    assert.equal(hasDashboardAccess({ plan: 'free', subscriptionStatus: 'none' }), true);
  });

  it('blocks incomplete unpaid checkout', () => {
    assert.equal(
      hasDashboardAccess({ plan: 'none', subscriptionStatus: 'incomplete' }),
      false,
    );
    assert.equal(
      getDashboardAccessRedirect({ plan: 'none', subscriptionStatus: 'incomplete' }, '/dashboard'),
      '/onboarding',
    );
    assert.equal(
      getDashboardAccessRedirect(
        { plan: 'none', subscriptionStatus: 'incomplete' },
        '/onboarding?checkout=cancelled',
      ),
      null,
    );
  });

  it('sends past_due and canceled to billing only', () => {
    assert.equal(
      getDashboardAccessRedirect({ plan: 'solo', subscriptionStatus: 'past_due' }, '/dashboard'),
      '/dashboard/billing',
    );
    assert.equal(
      getDashboardAccessRedirect(
        { plan: 'solo', subscriptionStatus: 'past_due' },
        '/dashboard/billing',
      ),
      null,
    );
    assert.equal(
      getDashboardAccessRedirect(
        { plan: 'solo', subscriptionStatus: 'canceled' },
        '/dashboard/employees',
      ),
      '/dashboard/billing',
    );
  });

  it('blocks none/non-freemium from dashboard', () => {
    assert.equal(hasDashboardAccess({ plan: 'none', subscriptionStatus: 'none' }), false);
    assert.equal(
      getDashboardAccessRedirect({ plan: 'none', subscriptionStatus: 'none' }, '/dashboard'),
      '/onboarding',
    );
  });
});
