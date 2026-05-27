import type { Stripe } from 'stripe';
import mongoose from 'mongoose';
import type { SubscriptionPlanDoc } from '../models/SubscriptionPlan';
import { getStripe } from '../stripe/client';
import { getStripePlanProductTaxCode } from '../stripe/config';
import {
  deactivateStripePrice,
  priceMatchesBasePlan,
  priceMatchesSeatPlan,
  resolveOrCreatePrice,
} from '../stripe/resolveStripePrice';

export type PlanForSync = SubscriptionPlanDoc & { _id: mongoose.Types.ObjectId };

function recurringForInterval(
  interval: SubscriptionPlanDoc['interval']
): Stripe.PriceCreateParams.Recurring | undefined {
  if (interval === 'lifetime') return undefined;
  return {
    interval: interval === 'year' ? 'year' : 'month',
    usage_type: 'licensed',
  };
}

/**
 * Creates/updates Stripe Product and Price rows for the plan.
 * Reuses existing prices when amount and interval are unchanged; creates new prices
 * (and deactivates old ones) only when billing terms change.
 */
export async function syncPlanToStripe(plan: PlanForSync) {
  const stripe = getStripe();
  const meta = {
    tailnoteSubscriptionPlanId: plan._id.toString(),
    tailnotePlanSlug: plan.slug,
    tailnotePlanVersion: String(plan.version),
  };

  const taxCode = getStripePlanProductTaxCode();
  const productFields = {
    name: plan.name,
    description: plan.description || undefined,
    metadata: meta,
    ...(taxCode ? { tax_code: taxCode } : {}),
  };

  let productId = plan.stripeProductId;
  if (!productId) {
    const product = await stripe.products.create(productFields);
    productId = product.id;
  } else {
    await stripe.products.update(productId, productFields);
  }

  const baseParams: Stripe.PriceCreateParams = {
    product: productId,
    currency: 'usd',
    unit_amount: plan.basePriceCents,
    metadata: meta,
    ...(plan.interval === 'lifetime'
      ? {}
      : { recurring: recurringForInterval(plan.interval) }),
  };

  const basePriceId = await resolveOrCreatePrice(stripe, {
    existingPriceId: plan.stripeBasePriceId,
    createParams: baseParams,
    matches: (price) => priceMatchesBasePlan(price, plan, productId),
  });

  let seatPriceId = '';
  const previousSeatPriceId = plan.stripeSeatPriceId?.trim() || '';

  if (plan.additionalUserPriceCents > 0 && plan.interval !== 'lifetime') {
    seatPriceId = await resolveOrCreatePrice(stripe, {
      existingPriceId: plan.stripeSeatPriceId,
      createParams: {
        product: productId,
        currency: 'usd',
        unit_amount: plan.additionalUserPriceCents,
        recurring: {
          interval: plan.interval === 'year' ? 'year' : 'month',
          usage_type: 'licensed',
        },
        metadata: { ...meta, tailnotePriceRole: 'seat' },
      },
      matches: (price) => priceMatchesSeatPlan(price, plan, productId),
    });
  } else if (previousSeatPriceId) {
    await deactivateStripePrice(stripe, previousSeatPriceId);
  }

  return {
    stripeProductId: productId,
    stripeBasePriceId: basePriceId,
    stripeSeatPriceId: seatPriceId,
  };
}
