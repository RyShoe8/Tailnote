import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { trialEndsAtFromStripeSubscription } from './stripeTrialEnd';

describe('trialEndsAtFromStripeSubscription', () => {
  it('maps unix trial_end to Date', () => {
    const d = trialEndsAtFromStripeSubscription({ trial_end: 1_700_000_000 });
    assert.ok(d instanceof Date);
    assert.equal(d?.getTime(), 1_700_000_000_000);
  });

  it('returns undefined when trial_end missing', () => {
    assert.equal(trialEndsAtFromStripeSubscription({ trial_end: null }), undefined);
    assert.equal(trialEndsAtFromStripeSubscription({ trial_end: 0 }), undefined);
  });
});
