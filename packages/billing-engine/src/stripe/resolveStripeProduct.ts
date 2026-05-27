import Stripe from 'stripe';
import type { Stripe as StripeTypes } from 'stripe';

export function isStripeResourceMissing(err: unknown): boolean {
  if (err instanceof Stripe.errors.StripeInvalidRequestError) {
    return err.code === 'resource_missing';
  }
  return false;
}

export type ResolveOrCreateStripeProductResult = {
  productId: string;
  /** True when a new Stripe product was created (missing id or deleted in Stripe). */
  recreated: boolean;
};

/**
 * Update an existing Stripe product or create one when the id is missing or deleted.
 */
export async function resolveOrCreateStripeProduct(
  stripe: Stripe,
  input: {
    existingProductId?: string | null;
    fields: StripeTypes.ProductCreateParams;
  }
): Promise<ResolveOrCreateStripeProductResult> {
  const existingId = input.existingProductId?.trim() || '';

  if (!existingId) {
    const product = await stripe.products.create(input.fields);
    return { productId: product.id, recreated: true };
  }

  try {
    await stripe.products.update(existingId, input.fields);
    return { productId: existingId, recreated: false };
  } catch (err) {
    if (!isStripeResourceMissing(err)) {
      throw err;
    }
    const product = await stripe.products.create(input.fields);
    return { productId: product.id, recreated: true };
  }
}
