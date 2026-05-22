import mongoose from 'mongoose';
import { isActiveSubscriptionStatus } from '@/lib/billing/subscriptionAccess';
import { getEffectiveSeatCount } from '@/lib/billing/employeeLimits';
import { ensureOwnerEmployeeForOrganization } from '@/lib/employees/ensureOwnerEmployee';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { OrganizationSubscriptionModel } from '@/models/OrganizationSubscription';
import type { SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { getStripe } from '@/lib/stripe/client';
import { persistOrganizationSubscriptionStripeItems } from '@/lib/stripe/subscriptionItemSync';

type OrgSubSeatRow = {
  stripeSubscriptionId: string;
  stripeSeatItemId: string;
  status?: string;
  subscriptionPlanId: SubscriptionPlanDoc | null;
};

/**
 * Updates Stripe subscription seat line quantity from current employee count vs plan `includedUsers`.
 * No-op when there is no active Stripe subscription or plan has no seat price.
 */
export async function syncStripeSubscriptionSeatsForOrganization(
  organizationId: string | mongoose.Types.ObjectId
): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) return;
  await connectMongoose();
  const orgId =
    typeof organizationId === 'string'
      ? new mongoose.Types.ObjectId(organizationId)
      : organizationId;

  const orgSub = await OrganizationSubscriptionModel.findOne({ organizationId: orgId })
    .populate('subscriptionPlanId')
    .lean<OrgSubSeatRow>();
  if (!orgSub?.stripeSubscriptionId) return;
  if (!isActiveSubscriptionStatus(orgSub.status)) return;

  const plan = orgSub.subscriptionPlanId;
  if (!plan?.stripeSeatPriceId || plan.interval === 'lifetime') return;

  await ensureOwnerEmployeeForOrganization(orgId);
  const count = getEffectiveSeatCount(
    await EmployeeModel.countDocuments({ organizationId: orgId })
  );
  const additional = Math.max(0, count - (plan.includedUsers ?? 1));
  const stripe = getStripe();
  const subId = orgSub.stripeSubscriptionId;
  const seatItemId = orgSub.stripeSeatItemId;

  if (additional === 0 && !seatItemId) {
    await OrganizationSubscriptionModel.updateOne(
      { organizationId: orgId },
      { $set: { seats: Math.max(1, count) } }
    );
    return;
  }

  if (seatItemId && additional === 0) {
    const updated = await stripe.subscriptions.update(subId, {
      items: [{ id: seatItemId, deleted: true }],
      proration_behavior: 'always_invoice',
    });
    await OrganizationSubscriptionModel.updateOne(
      { organizationId: orgId },
      { $set: { stripeSeatItemId: '', seats: Math.max(1, count) } }
    );
    await persistOrganizationSubscriptionStripeItems(orgId, updated, plan);
    return;
  }

  if (!seatItemId && additional > 0) {
    const updated = await stripe.subscriptions.update(subId, {
      items: [{ price: plan.stripeSeatPriceId, quantity: additional }],
      proration_behavior: 'always_invoice',
    });
    await persistOrganizationSubscriptionStripeItems(orgId, updated, plan);
    await OrganizationSubscriptionModel.updateOne(
      { organizationId: orgId },
      { $set: { seats: Math.max(1, count) } }
    );
    return;
  }

  if (seatItemId) {
    await stripe.subscriptions.update(subId, {
      items: [{ id: seatItemId, quantity: additional }],
      proration_behavior: 'always_invoice',
    });
  }

  await OrganizationSubscriptionModel.updateOne(
    { organizationId: orgId },
    { $set: { seats: Math.max(1, count) } }
  );
}
