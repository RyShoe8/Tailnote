import type { Stripe } from 'stripe';
import type { SubscriptionAddonDoc } from '../models/SubscriptionAddon';
import type { SubscriptionPlanDoc } from '../models/SubscriptionPlan';

function priceProductId(price: Stripe.Price): string {
  const product = price.product;
  return typeof product === 'string' ? product : product.id;
}

export function priceMatchesBasePlan(
  price: Stripe.Price,
  plan: Pick<SubscriptionPlanDoc, 'basePriceCents' | 'interval'>,
  productId: string
): boolean {
  if (priceProductId(price) !== productId) return false;
  if (price.currency !== 'usd') return false;
  if (price.unit_amount !== plan.basePriceCents) return false;

  if (plan.interval === 'lifetime') {
    return price.type === 'one_time' || !price.recurring;
  }

  if (!price.recurring) return false;
  const expectedInterval = plan.interval === 'year' ? 'year' : 'month';
  return price.recurring.interval === expectedInterval;
}

export function priceMatchesSeatPlan(
  price: Stripe.Price,
  plan: Pick<SubscriptionPlanDoc, 'additionalUserPriceCents' | 'interval'>,
  productId: string
): boolean {
  if (plan.interval === 'lifetime') return false;
  if (priceProductId(price) !== productId) return false;
  if (price.currency !== 'usd') return false;
  if (price.unit_amount !== plan.additionalUserPriceCents) return false;
  if (!price.recurring) return false;
  const expectedInterval = plan.interval === 'year' ? 'year' : 'month';
  return price.recurring.interval === expectedInterval;
}

export function priceMatchesAddon(
  price: Stripe.Price,
  addon: Pick<SubscriptionAddonDoc, 'priceCents' | 'interval'>,
  productId: string
): boolean {
  if (priceProductId(price) !== productId) return false;
  if (price.currency !== 'usd') return false;
  if (price.unit_amount !== addon.priceCents) return false;

  if (addon.interval === 'one_time') {
    return price.type === 'one_time' || !price.recurring;
  }

  if (!price.recurring) return false;
  const expectedInterval = addon.interval === 'year' ? 'year' : 'month';
  return price.recurring.interval === expectedInterval;
}

export async function deactivateStripePrice(
  stripe: Stripe,
  priceId?: string | null
): Promise<void> {
  const id = priceId?.trim();
  if (!id) return;
  try {
    await stripe.prices.update(id, { active: false });
  } catch {
    // Best-effort; superseded prices may already be inactive or deleted.
  }
}

/**
 * Reuse an existing Stripe Price when it still matches billing terms; otherwise create
 * a new immutable price and deactivate the previous one.
 */
export async function resolveOrCreatePrice(
  stripe: Stripe,
  input: {
    existingPriceId?: string | null;
    createParams: Stripe.PriceCreateParams;
    matches: (price: Stripe.Price) => boolean;
  }
): Promise<string> {
  const previousId = input.existingPriceId?.trim() || '';

  if (previousId) {
    try {
      const existing = await stripe.prices.retrieve(previousId);
      if (input.matches(existing)) {
        return existing.id;
      }
    } catch {
      // Missing or invalid price id — create a new price below.
    }
  }

  const created = await stripe.prices.create(input.createParams);

  if (previousId && previousId !== created.id) {
    await deactivateStripePrice(stripe, previousId);
  }

  return created.id;
}
