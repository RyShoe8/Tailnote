import mongoose from 'mongoose';
import { getEffectiveSeatCount } from '@/lib/billing/employeeLimits';
import { EmployeeModel } from '@/models/Employee';
import { OrganizationModel } from '@/models/Organization';
import { OrganizationSubscriptionModel } from '@/models/OrganizationSubscription';
import { SubscriptionPlanModel } from '@/models/SubscriptionPlan';

export async function assignOrganizationPlan(
  orgId: mongoose.Types.ObjectId,
  planId: mongoose.Types.ObjectId,
  subscriptionStatus?: string
): Promise<void> {
  const plan = await SubscriptionPlanModel.findById(planId).lean();
  if (!plan || plan.archived) {
    throw new Error('Plan not found or archived');
  }

  const seatCount = getEffectiveSeatCount(await EmployeeModel.countDocuments({ organizationId: orgId }));
  const status =
    subscriptionStatus && subscriptionStatus !== 'none' ? subscriptionStatus : 'active';

  await OrganizationSubscriptionModel.findOneAndUpdate(
    { organizationId: orgId },
    {
      $set: {
        subscriptionPlanId: planId,
        status,
        seats: seatCount,
        grandfathered: true,
        startedAt: new Date(),
      },
    },
    { upsert: true }
  );

  await OrganizationModel.findByIdAndUpdate(orgId, {
    $set: {
      plan: String(plan.slug),
      subscriptionStatus: status,
    },
  });
}
