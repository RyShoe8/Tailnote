import { OrganizationModel } from '@/models/Organization';

const PAID_STATUSES = ['active', 'trialing'] as const;

export type MigrateDefaultFreePlanResult = {
  totalOrganizations: number;
  paidPlanBackfilled: number;
  freePlanDefaulted: number;
};

/**
 * Idempotent backfill: paid orgs without a plan slug get team; everyone else non-paid becomes free.
 */
export async function migrateDefaultFreePlanOrganizations(): Promise<MigrateDefaultFreePlanResult> {
  const preservePaid = await OrganizationModel.updateMany(
    {
      subscriptionStatus: { $in: [...PAID_STATUSES] },
      plan: { $in: [null, '', 'none'] },
    },
    { $set: { plan: 'team' } }
  );

  const defaultFree = await OrganizationModel.updateMany(
    {
      $or: [
        { subscriptionStatus: { $exists: false } },
        { subscriptionStatus: null },
        { subscriptionStatus: { $nin: [...PAID_STATUSES] } },
      ],
    },
    {
      $set: {
        plan: 'free',
        subscriptionStatus: 'none',
        signatureClickTrackingEnabled: false,
        signatureOpenTrackingEnabled: false,
      },
    }
  );

  const totalOrganizations = await OrganizationModel.countDocuments();

  return {
    totalOrganizations,
    paidPlanBackfilled: preservePaid.modifiedCount ?? 0,
    freePlanDefaulted: defaultFree.modifiedCount ?? 0,
  };
}
