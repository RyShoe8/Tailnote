import type { Stripe } from 'stripe';
import mongoose from 'mongoose';
import type { SubscriptionAddonDoc } from '../models/SubscriptionAddon';
import { getStripe } from '../stripe/client';
import { priceMatchesAddon, resolveOrCreatePrice } from '../stripe/resolveStripePrice';

export type AddonForSync = SubscriptionAddonDoc & { _id: mongoose.Types.ObjectId };

/**
 * Creates/updates Stripe Product and Price for the add-on.
 * Reuses existing price when amount and interval are unchanged.
 */
export async function syncAddonToStripe(addon: AddonForSync) {
  const stripe = getStripe();
  const meta = {
    tailnoteAddonId: addon._id.toString(),
    tailnoteAddonSlug: addon.slug,
  };

  let productId = addon.stripeProductId;
  if (!productId) {
    const product = await stripe.products.create({
      name: addon.name,
      description: addon.description || undefined,
      metadata: meta,
    });
    productId = product.id;
  } else {
    await stripe.products.update(productId, {
      name: addon.name,
      description: addon.description || undefined,
      metadata: meta,
    });
  }

  const baseParams: Stripe.PriceCreateParams = {
    product: productId,
    currency: 'usd',
    unit_amount: addon.priceCents,
    metadata: meta,
    ...(addon.interval === 'one_time'
      ? {}
      : { recurring: { interval: addon.interval === 'year' ? 'year' : 'month' } }),
  };

  const priceId = await resolveOrCreatePrice(stripe, {
    existingPriceId: addon.stripePriceId,
    createParams: baseParams,
    matches: (price) => priceMatchesAddon(price, addon, productId),
  });

  return { stripeProductId: productId, stripePriceId: priceId };
}
