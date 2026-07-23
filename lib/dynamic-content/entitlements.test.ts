import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import { getBillingEntitlements } from '@/lib/billing/entitlements';

describe('dynamic content entitlement', () => {
  let prevStripeKey: string | undefined;

  before(() => {
    prevStripeKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = 'sk_test_dynamic_content';
  });

  after(() => {
    if (prevStripeKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = prevStripeKey;
  });

  it('denies free plan', () => {
    assert.equal(
      getBillingEntitlements({ plan: 'free', subscriptionStatus: 'none' }).canUseDynamicContent,
      false
    );
  });

  it('allows active paid plan', () => {
    assert.equal(
      getBillingEntitlements({ plan: 'solo', subscriptionStatus: 'active' }).canUseDynamicContent,
      true
    );
  });
});
