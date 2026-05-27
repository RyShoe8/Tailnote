import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Stripe } from 'stripe';
import {
  priceMatchesAddon,
  priceMatchesBasePlan,
  priceMatchesSeatPlan,
} from './resolveStripePrice';

function price(overrides: Partial<Stripe.Price> & Pick<Stripe.Price, 'unit_amount'>): Stripe.Price {
  return {
    id: 'price_test',
    object: 'price',
    active: true,
    billing_scheme: 'per_unit',
    created: 0,
    currency: 'usd',
    custom_unit_amount: null,
    livemode: false,
    lookup_key: null,
    metadata: {},
    nickname: null,
    product: 'prod_test',
    tax_behavior: 'unspecified',
    tiers_mode: null,
    transform_quantity: null,
    type: 'recurring',
    unit_amount_decimal: null,
    ...overrides,
  } as Stripe.Price;
}

describe('priceMatchesBasePlan', () => {
  it('matches monthly base price on same product and amount', () => {
    const p = price({
      unit_amount: 10000,
      type: 'recurring',
      recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed', trial_period_days: null, aggregate_usage: null, meter: null } as Stripe.Price.Recurring,
    });
    assert.equal(priceMatchesBasePlan(p, { basePriceCents: 10000, interval: 'month' }, 'prod_test'), true);
  });

  it('rejects lifetime plan when price is recurring', () => {
    const p = price({
      unit_amount: 10000,
      type: 'recurring',
      recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed', trial_period_days: null, aggregate_usage: null, meter: null } as Stripe.Price.Recurring,
    });
    assert.equal(priceMatchesBasePlan(p, { basePriceCents: 10000, interval: 'lifetime' }, 'prod_test'), false);
  });

  it('matches lifetime one-time price', () => {
    const p = price({ unit_amount: 50000, type: 'one_time', recurring: null });
    assert.equal(priceMatchesBasePlan(p, { basePriceCents: 50000, interval: 'lifetime' }, 'prod_test'), true);
  });

  it('rejects different unit amount', () => {
    const p = price({
      unit_amount: 10000,
      type: 'recurring',
      recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed', trial_period_days: null, aggregate_usage: null, meter: null } as Stripe.Price.Recurring,
    });
    assert.equal(priceMatchesBasePlan(p, { basePriceCents: 9900, interval: 'month' }, 'prod_test'), false);
  });
});

describe('priceMatchesSeatPlan', () => {
  it('matches seat recurring price', () => {
    const p = price({
      unit_amount: 1500,
      type: 'recurring',
      recurring: { interval: 'year', interval_count: 1, usage_type: 'licensed', trial_period_days: null, aggregate_usage: null, meter: null } as Stripe.Price.Recurring,
    });
    assert.equal(
      priceMatchesSeatPlan(p, { additionalUserPriceCents: 1500, interval: 'year' }, 'prod_test'),
      true
    );
  });
});

describe('priceMatchesAddon', () => {
  it('matches one-time addon price', () => {
    const p = price({ unit_amount: 2500, type: 'one_time', recurring: null });
    assert.equal(priceMatchesAddon(p, { priceCents: 2500, interval: 'one_time' }, 'prod_test'), true);
  });
});
