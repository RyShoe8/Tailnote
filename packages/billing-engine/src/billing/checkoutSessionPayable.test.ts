import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isCheckoutSessionPayable } from './checkoutSessionPayable';

describe('isCheckoutSessionPayable', () => {
  it('accepts paid sessions', () => {
    assert.equal(isCheckoutSessionPayable({ mode: 'subscription', payment_status: 'paid' }), true);
    assert.equal(isCheckoutSessionPayable({ mode: 'payment', payment_status: 'paid' }), true);
  });

  it('accepts no_payment_required for subscription trials', () => {
    assert.equal(
      isCheckoutSessionPayable({ mode: 'subscription', payment_status: 'no_payment_required' }),
      true
    );
  });

  it('rejects unpaid non-trial subscription checkout', () => {
    assert.equal(isCheckoutSessionPayable({ mode: 'subscription', payment_status: 'unpaid' }), false);
  });

  it('rejects no_payment_required for one-time payment mode', () => {
    assert.equal(
      isCheckoutSessionPayable({ mode: 'payment', payment_status: 'no_payment_required' }),
      false
    );
  });
});
