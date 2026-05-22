import mongoose from 'mongoose';
import type Stripe from 'stripe';
import { isValidObjectIdString } from '@/lib/admin/data';
import {
  CheckoutSessionError,
  createCheckoutSessionForOrganization,
  validatePlanForCheckout,
} from '@/lib/billing/createCheckoutSession';
import { getEffectiveSeatCount } from '@/lib/billing/employeeLimits';
import { isActiveSubscriptionStatus } from '@/lib/billing/subscriptionAccess';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import type { OrganizationDoc } from '@/models/Organization';
import { OrganizationModel } from '@/models/Organization';
import { OrganizationSubscriptionModel } from '@/models/OrganizationSubscription';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { getStripe } from '@/lib/stripe/client';
import { persistOrganizationSubscriptionStripeItems } from '@/lib/stripe/subscriptionItemSync';
import { syncStripeSubscriptionSeatsForOrganization } from '@/lib/stripe/syncSubscriptionSeats';

export class ChangePlanError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'ChangePlanError';
  }
}

export type ChangePlanResult =
  | { mode: 'checkout'; url: string }
  | { mode: 'updated'; subscriptionPlanId: string; planSlug: string };

export async function changeStripeSubscriptionPlan(args: {
  org: OrganizationDoc;
  userEmail?: string | null;
  subscriptionPlanId: string;
}): Promise<ChangePlanResult> {
  const planId = args.subscriptionPlanId.trim();
  if (!isValidObjectIdString(planId)) {
    throw new ChangePlanError('Invalid subscriptionPlanId', 400);
  }

  await connectMongoose();
  const targetPlan = await SubscriptionPlanModel.findById(planId).lean<SubscriptionPlanDoc>();
  if (!targetPlan || targetPlan.archived) {
    throw new ChangePlanError('Plan not found', 404);
  }

  const orgId = args.org._id;
  await validatePlanForCheckout(targetPlan, orgId.toString()).catch((e) => {
    if (e instanceof CheckoutSessionError) {
      throw new ChangePlanError(e.message, e.status);
    }
    throw e;
  });

  const orgSub = await OrganizationSubscriptionModel.findOne({ organizationId: orgId }).lean();
  const hasRecurringStripeSub =
    Boolean(args.org.stripeSubscriptionId?.trim()) &&
    isActiveSubscriptionStatus(args.org.subscriptionStatus) &&
    isActiveSubscriptionStatus(orgSub?.status);

  const useCheckout =
    targetPlan.interval === 'lifetime' ||
    !hasRecurringStripeSub ||
    !targetPlan.stripeBasePriceId;

  if (useCheckout) {
    try {
      const { url } = await createCheckoutSessionForOrganization({
        org: args.org,
        userEmail: args.userEmail,
        subscriptionPlanId: planId,
      });
      return { mode: 'checkout', url };
    } catch (e) {
      if (e instanceof CheckoutSessionError) {
        throw new ChangePlanError(e.message, e.status);
      }
      throw e;
    }
  }

  const stripe = getStripe();
  const subId = args.org.stripeSubscriptionId!.trim();
  const sub = await stripe.subscriptions.retrieve(subId, { expand: ['items.data.price'] });

  const currentPlan = orgSub?.subscriptionPlanId
    ? await SubscriptionPlanModel.findById(orgSub.subscriptionPlanId).lean<SubscriptionPlanDoc>()
    : null;

  const baseItemId = orgSub?.stripeBaseItemId?.trim() || '';
  const seatItemId = orgSub?.stripeSeatItemId?.trim() || '';

  const items: Stripe.SubscriptionUpdateParams.Item[] = [];

  if (baseItemId) {
    items.push({ id: baseItemId, price: targetPlan.stripeBasePriceId });
  } else {
    items.push({ price: targetPlan.stripeBasePriceId });
  }

  const seatCount = getEffectiveSeatCount(
    await EmployeeModel.countDocuments({ organizationId: orgId })
  );
  const additional = Math.max(0, seatCount - (targetPlan.includedUsers ?? 1));
  const targetSupportsSeats =
    targetPlan.additionalUserPriceCents > 0 &&
    Boolean(targetPlan.stripeSeatPriceId) &&
    targetPlan.interval !== 'lifetime';

  if (!targetSupportsSeats) {
    if (seatItemId) {
      items.push({ id: seatItemId, deleted: true });
    }
  } else if (seatItemId) {
    items.push({ id: seatItemId, quantity: additional });
  } else if (additional > 0) {
    items.push({ price: targetPlan.stripeSeatPriceId, quantity: additional });
  }

  const updated = await stripe.subscriptions.update(subId, {
    items,
    proration_behavior: 'always_invoice',
    metadata: {
      organizationId: orgId.toString(),
      subscriptionPlanId: String(targetPlan._id),
    },
  });

  const planObjId = new mongoose.Types.ObjectId(String(targetPlan._id));
  await OrganizationSubscriptionModel.findOneAndUpdate(
    { organizationId: orgId },
    {
      $set: {
        subscriptionPlanId: planObjId,
        status: updated.status === 'trialing' ? 'trialing' : 'active',
      },
    },
    { upsert: true }
  );

  await OrganizationModel.findByIdAndUpdate(orgId, {
    $set: {
      plan: String(targetPlan.slug),
      subscriptionStatus: updated.status === 'trialing' ? 'trialing' : 'active',
    },
  });

  await persistOrganizationSubscriptionStripeItems(orgId, updated, targetPlan);
  await syncStripeSubscriptionSeatsForOrganization(orgId);

  void currentPlan;

  return {
    mode: 'updated',
    subscriptionPlanId: String(targetPlan._id),
    planSlug: String(targetPlan.slug),
  };
}
