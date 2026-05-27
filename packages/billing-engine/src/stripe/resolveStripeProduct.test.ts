import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Stripe from 'stripe';
import { isStripeResourceMissing } from './resolveStripeProduct';

describe('isStripeResourceMissing', () => {
  it('returns true for Stripe resource_missing errors', () => {
    const err = new Stripe.errors.StripeInvalidRequestError({
      message: "No such product: 'prod_deleted'",
      type: 'invalid_request_error',
      code: 'resource_missing',
    });
    assert.equal(isStripeResourceMissing(err), true);
  });

  it('returns false for other Stripe invalid request errors', () => {
    const err = new Stripe.errors.StripeInvalidRequestError({
      message: 'Invalid tax code',
      type: 'invalid_request_error',
      code: 'parameter_invalid_empty',
    });
    assert.equal(isStripeResourceMissing(err), false);
  });

  it('returns false for generic errors', () => {
    assert.equal(isStripeResourceMissing(new Error('No such product')), false);
  });
});
