import mongoose from 'mongoose';
import { getOrganizationModel } from '../context';
import { OrganizationSubscriptionModel } from '../models/OrganizationSubscription';
import type { SubscriptionPlanDoc } from '../models/SubscriptionPlan';

/** Pure eligibility check for unit tests and checkout trial resolution. */
export function planTrialDaysIfEligible(
  plan: Pick<SubscriptionPlanDoc, 'interval' | 'trialDays'>,
  org: { subscriptionStatus?: string | null },
  hadPriorSubscription: boolean
): number | undefined {
  if (plan.interval === 'lifetime') return undefined;
  const days = Number(plan.trialDays ?? 0);
  if (days <= 0) return undefined;
  if (hadPriorSubscription) return undefined;
  if (org.subscriptionStatus && org.subscriptionStatus !== 'none') return undefined;
  return days;
}

/** Trial days for Stripe Checkout on first subscription only. */
export async function resolveCheckoutTrialDays(
  orgId: string,
  plan: SubscriptionPlanDoc
): Promise<number | undefined> {
  const OrganizationModel = getOrganizationModel();
  const orgObjId = new mongoose.Types.ObjectId(orgId);
  const [org, priorSub] = await Promise.all([
    OrganizationModel.findById(orgId).select('subscriptionStatus').lean<{ subscriptionStatus?: string }>(),
    OrganizationSubscriptionModel.findOne({ organizationId: orgObjId, startedAt: { $exists: true, $ne: null } })
      .select('_id')
      .lean(),
  ]);

  return planTrialDaysIfEligible(plan, org ?? {}, Boolean(priorSub));
}
