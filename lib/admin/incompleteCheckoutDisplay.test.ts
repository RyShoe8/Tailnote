import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatAdminPlanDisplayName,
  formatAdminSubscriptionStatusLabel,
  isIncompleteCheckoutDisplay,
} from './incompleteCheckoutDisplay';

describe('incompleteCheckoutDisplay', () => {
  const unpaidPin = {
    subscriptionStatus: 'incomplete',
    subscriptionPlanId: '6a0abedd68f19ebd4aa9d5e7',
    stripeSubscriptionId: '',
  };

  it('detects abandoned checkout: incomplete + pinned plan + no Stripe sub', () => {
    assert.equal(isIncompleteCheckoutDisplay(unpaidPin), true);
  });

  it('does not flag active paid orgs', () => {
    assert.equal(
      isIncompleteCheckoutDisplay({
        subscriptionStatus: 'active',
        subscriptionPlanId: '6a0abedd68f19ebd4aa9d5e7',
        stripeSubscriptionId: 'sub_123',
      }),
      false,
    );
  });

  it('does not flag incomplete without a pinned plan', () => {
    assert.equal(
      isIncompleteCheckoutDisplay({
        subscriptionStatus: 'incomplete',
        subscriptionPlanId: '',
        stripeSubscriptionId: '',
      }),
      false,
    );
  });

  it('does not treat incomplete+Stripe id as abandoned checkout display', () => {
    assert.equal(
      isIncompleteCheckoutDisplay({
        subscriptionStatus: 'incomplete',
        subscriptionPlanId: '6a0abedd68f19ebd4aa9d5e7',
        stripeSubscriptionId: 'sub_pending',
      }),
      false,
    );
  });

  it('appends checkout incomplete to plan display name', () => {
    const label = formatAdminPlanDisplayName('Solo (v1, year)', unpaidPin);
    assert.equal(label, 'Solo (v1, year) · checkout incomplete');
    assert.notEqual(label, 'Solo (v1, year)');
  });

  it('leaves active plan display names unchanged', () => {
    assert.equal(
      formatAdminPlanDisplayName('Solo (v1, year)', {
        subscriptionStatus: 'active',
        subscriptionPlanId: '6a0abedd68f19ebd4aa9d5e7',
        stripeSubscriptionId: 'sub_123',
      }),
      'Solo (v1, year)',
    );
  });

  it('does not decorate None', () => {
    assert.equal(formatAdminPlanDisplayName('None', unpaidPin), 'None');
  });

  it('formats status label for incomplete checkout', () => {
    assert.equal(
      formatAdminSubscriptionStatusLabel(unpaidPin),
      'incomplete · checkout incomplete',
    );
    assert.equal(
      formatAdminSubscriptionStatusLabel({
        subscriptionStatus: 'active',
        subscriptionPlanId: 'x',
        stripeSubscriptionId: 'sub_1',
      }),
      'active',
    );
  });
});
