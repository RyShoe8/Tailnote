import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planTrialDaysIfEligible } from './resolveCheckoutTrialDays';

describe('planTrialDaysIfEligible', () => {
  const plan = { interval: 'year' as const, trialDays: 14 };

  it('returns trial days for first subscription on eligible org', () => {
    assert.equal(planTrialDaysIfEligible(plan, { subscriptionStatus: 'none' }, false), 14);
  });

  it('returns undefined when org already subscribed', () => {
    assert.equal(planTrialDaysIfEligible(plan, { subscriptionStatus: 'active' }, false), undefined);
    assert.equal(planTrialDaysIfEligible(plan, { subscriptionStatus: 'trialing' }, false), undefined);
    assert.equal(planTrialDaysIfEligible(plan, { subscriptionStatus: 'canceled' }, false), undefined);
  });

  it('returns undefined when org had a prior subscription', () => {
    assert.equal(planTrialDaysIfEligible(plan, { subscriptionStatus: 'none' }, true), undefined);
  });

  it('returns undefined when trialDays is zero', () => {
    assert.equal(
      planTrialDaysIfEligible({ interval: 'year', trialDays: 0 }, { subscriptionStatus: 'none' }, false),
      undefined
    );
  });

  it('returns undefined for lifetime plans', () => {
    assert.equal(
      planTrialDaysIfEligible({ interval: 'lifetime', trialDays: 14 }, { subscriptionStatus: 'none' }, false),
      undefined
    );
  });
});
