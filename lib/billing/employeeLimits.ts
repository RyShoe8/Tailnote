import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { OrganizationModel } from '@/models/Organization';
import { OrganizationSubscriptionModel } from '@/models/OrganizationSubscription';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { isActiveSubscriptionStatus, isOrganizationPaid } from '@/lib/billing/subscriptionAccess';
import { ensureOwnerEmployeeForOrganization } from '@/lib/employees/ensureOwnerEmployee';

export type EmployeeLimitInfo = {
  /** Seats in use (employee documents, including owner). */
  currentCount: number;
  maxEmployees: number | null;
  /** Included users on the plan, when a plan is resolved. */
  includedUsers: number | null;
  canAddMore: boolean;
  canAddBeyondIncluded: boolean;
};

/** Billable seat count from employee documents (owner row ensured before counting). */
export function getEffectiveSeatCount(employeeDocumentCount: number): number {
  return employeeDocumentCount;
}

export class EmployeeLimitReachedError extends Error {
  readonly code = 'employee_limit_reached' as const;
  readonly maxEmployees: number;
  readonly currentCount: number;

  constructor(maxEmployees: number, currentCount: number) {
    super(
      `Your plan includes ${maxEmployees} user${maxEmployees === 1 ? '' : 's'}. Choose a plan with additional users to add more.`
    );
    this.name = 'EmployeeLimitReachedError';
    this.maxEmployees = maxEmployees;
    this.currentCount = currentCount;
  }
}

export function getEmployeeLimitForPlan(
  plan: Pick<SubscriptionPlanDoc, 'includedUsers' | 'additionalUserPriceCents'>
): Pick<EmployeeLimitInfo, 'maxEmployees' | 'canAddBeyondIncluded'> {
  if (plan.additionalUserPriceCents > 0) {
    return { maxEmployees: null, canAddBeyondIncluded: true };
  }
  return {
    maxEmployees: Math.max(1, plan.includedUsers ?? 1),
    canAddBeyondIncluded: false,
  };
}

export async function resolveOrganizationSubscriptionPlan(
  organizationId: string | mongoose.Types.ObjectId
): Promise<SubscriptionPlanDoc | null> {
  await connectMongoose();
  const orgId =
    typeof organizationId === 'string'
      ? new mongoose.Types.ObjectId(organizationId)
      : organizationId;

  const orgSub = await OrganizationSubscriptionModel.findOne({ organizationId: orgId })
    .populate('subscriptionPlanId')
    .lean<{ subscriptionPlanId: SubscriptionPlanDoc | null; status?: string }>();

  if (orgSub?.subscriptionPlanId && isActiveSubscriptionStatus(orgSub.status)) {
    return orgSub.subscriptionPlanId;
  }

  const org = await OrganizationModel.findById(orgId).select('plan').lean<{ plan?: string }>();
  const slug = org?.plan;
  if (!slug || slug === 'none') return null;

  return SubscriptionPlanModel.findOne({
    slug,
    active: true,
    paused: false,
    archived: false,
  })
    .sort({ version: -1 })
    .lean<SubscriptionPlanDoc>();
}

export async function getEmployeeLimitsForOrganization(
  organizationId: string | mongoose.Types.ObjectId
): Promise<EmployeeLimitInfo> {
  await connectMongoose();
  const orgId =
    typeof organizationId === 'string'
      ? new mongoose.Types.ObjectId(organizationId)
      : organizationId;

  await ensureOwnerEmployeeForOrganization(orgId);
  const employeeDocumentCount = await EmployeeModel.countDocuments({ organizationId: orgId });
  const currentCount = getEffectiveSeatCount(employeeDocumentCount);

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      currentCount,
      maxEmployees: null,
      includedUsers: null,
      canAddMore: true,
      canAddBeyondIncluded: true,
    };
  }

  const org = await OrganizationModel.findById(orgId).select('subscriptionStatus').lean<{
    subscriptionStatus?: string;
  }>();
  if (!isOrganizationPaid(org)) {
    return {
      currentCount,
      maxEmployees: 1,
      includedUsers: 1,
      canAddMore: false,
      canAddBeyondIncluded: false,
    };
  }

  const plan = await resolveOrganizationSubscriptionPlan(orgId);
  if (!plan) {
    return {
      currentCount,
      maxEmployees: null,
      includedUsers: null,
      canAddMore: true,
      canAddBeyondIncluded: true,
    };
  }

  const includedUsers = Math.max(1, plan.includedUsers ?? 1);
  const { maxEmployees, canAddBeyondIncluded } = getEmployeeLimitForPlan(plan);
  const canAddMore =
    maxEmployees === null ? true : currentCount < maxEmployees;

  return {
    currentCount,
    maxEmployees,
    includedUsers,
    canAddMore,
    canAddBeyondIncluded,
  };
}

export async function assertCanAddEmployee(
  organizationId: string | mongoose.Types.ObjectId
): Promise<void> {
  const limits = await getEmployeeLimitsForOrganization(organizationId);
  if (limits.canAddMore) return;
  if (limits.maxEmployees === null) return;
  throw new EmployeeLimitReachedError(limits.maxEmployees, limits.currentCount);
}
