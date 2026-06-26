import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getBillingEntitlements } from './entitlements';

describe('getBillingEntitlements', () => {
  it('includes BIMI logo hosting on the free tier', () => {
    const entitlements = getBillingEntitlements({ plan: 'free', subscriptionStatus: 'active' });
    assert.equal(entitlements.canUseBimiLogoHosting, true);
    assert.equal(entitlements.isPro, false);
  });
});
