import mongoose from 'mongoose';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import { AUTH_USER_COLLECTION } from '@/lib/auth/platformAdmin';
import { OrganizationModel } from '@/models/Organization';
import { OrganizationSubscriptionModel } from '@/models/OrganizationSubscription';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';

export type AdminOrgRow = {
  _id: string;
  name: string;
  /** Legacy slug on Organization.plan */
  plan: string;
  /** Human-readable pinned or resolved plan name */
  planDisplayName: string;
  /** Pinned SubscriptionPlan document id, or empty string */
  subscriptionPlanId: string;
  subscriptionStatus: string;
  createdAt?: Date;
  userCount: number;
};

export type AdminAssignablePlan = {
  id: string;
  name: string;
  slug: string;
  version: number;
  interval: string;
  active: boolean;
  paused: boolean;
  archived: boolean;
  listOnPricingPage: boolean;
  label: string;
};

export type AdminOrgPlanContext = {
  legacyPlanSlug: string;
  subscriptionStatus: string;
  initialSubscriptionPlanId: string;
  pinnedPlanLabel: string | null;
  assignablePlans: AdminAssignablePlan[];
};

export function formatAssignablePlanLabel(
  plan: Pick<AdminAssignablePlan, 'name' | 'version' | 'interval' | 'paused' | 'active' | 'listOnPricingPage'>
): string {
  const flags: string[] = [];
  if (plan.paused) flags.push('paused');
  if (!plan.active) flags.push('inactive');
  if (plan.listOnPricingPage === false) flags.push('hidden from pricing');
  const suffix = flags.length > 0 ? `, ${flags.join(', ')}` : '';
  return `${plan.name} (v${plan.version}, ${plan.interval}${suffix})`;
}

function formatPinnedPlanLabel(plan: Pick<SubscriptionPlanDoc, 'name' | 'version' | 'interval'>): string {
  return `${plan.name} (v${plan.version}, ${plan.interval})`;
}

export async function listAssignableSubscriptionPlans(): Promise<AdminAssignablePlan[]> {
  await connectMongoose();
  const rows = await SubscriptionPlanModel.find({ archived: false })
    .sort({ slug: 1, version: -1 })
    .lean<SubscriptionPlanDoc[]>();

  return rows.map((p) => {
    const plan = {
      id: String(p._id),
      name: String(p.name ?? ''),
      slug: String(p.slug ?? ''),
      version: Number(p.version ?? 1),
      interval: String(p.interval ?? 'year'),
      active: Boolean(p.active),
      paused: Boolean(p.paused),
      archived: Boolean(p.archived),
      listOnPricingPage: p.listOnPricingPage !== false,
    };
    return {
      ...plan,
      label: formatAssignablePlanLabel(plan),
    };
  });
}

export async function getOrganizationAdminPlanContext(organizationId: string): Promise<AdminOrgPlanContext> {
  await connectMongoose();
  const orgId = new mongoose.Types.ObjectId(organizationId);
  const org = await OrganizationModel.findById(orgId).select('plan subscriptionStatus').lean<{
    plan?: string;
    subscriptionStatus?: string;
  }>();

  const orgSub = await OrganizationSubscriptionModel.findOne({ organizationId: orgId })
    .populate('subscriptionPlanId')
    .lean<{ subscriptionPlanId?: SubscriptionPlanDoc | null }>();

  const pinned = orgSub?.subscriptionPlanId;
  const assignablePlans = await listAssignableSubscriptionPlans();

  return {
    legacyPlanSlug: String(org?.plan ?? 'none'),
    subscriptionStatus: String(org?.subscriptionStatus ?? 'none'),
    initialSubscriptionPlanId: pinned?._id ? String(pinned._id) : '',
    pinnedPlanLabel: pinned ? formatPinnedPlanLabel(pinned) : null,
    assignablePlans,
  };
}

export async function listOrganizationsWithUserCounts(): Promise<AdminOrgRow[]> {
  await connectMongoose();
  const orgs = await OrganizationModel.find().sort({ createdAt: -1 }).lean();
  const orgIds = orgs.map((o) => o._id);

  const subs = await OrganizationSubscriptionModel.find({ organizationId: { $in: orgIds } })
    .populate('subscriptionPlanId')
    .lean<Array<{ organizationId: mongoose.Types.ObjectId; subscriptionPlanId?: SubscriptionPlanDoc | null }>>();

  const subByOrgId = new Map(subs.map((s) => [String(s.organizationId), s]));

  const db = getMongoDb();
  const out: AdminOrgRow[] = [];
  for (const o of orgs) {
    const oid = String(o._id);
    const userCount = await db.collection(AUTH_USER_COLLECTION).countDocuments({ organizationId: oid });
    const legacyPlan = String(o.plan ?? 'none');
    const sub = subByOrgId.get(oid);
    const pinned = sub?.subscriptionPlanId;
    let planDisplayName = 'None';
    if (pinned) {
      planDisplayName = formatPinnedPlanLabel(pinned);
    } else if (legacyPlan !== 'none') {
      planDisplayName = legacyPlan;
    }

    out.push({
      _id: oid,
      name: String(o.name ?? ''),
      plan: legacyPlan,
      planDisplayName,
      subscriptionPlanId: pinned?._id ? String(pinned._id) : '',
      subscriptionStatus: String(o.subscriptionStatus ?? 'none'),
      createdAt: o.createdAt,
      userCount,
    });
  }
  return out;
}

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  platformAdmin: boolean;
  createdAt?: Date;
};

export async function listUsersInOrganization(organizationId: string): Promise<AdminUserRow[]> {
  await connectMongoose();
  const db = getMongoDb();
  const rows = await db
    .collection(AUTH_USER_COLLECTION)
    .find({ organizationId })
    .project({ _id: 1, email: 1, name: 1, role: 1, platformAdmin: 1, createdAt: 1 })
    .sort({ email: 1 })
    .toArray();

  return rows.map((r) => ({
    id: String((r as { _id?: unknown })._id ?? ''),
    email: String((r as { email?: string }).email ?? ''),
    name: String((r as { name?: string }).name ?? ''),
    role: String((r as { role?: string }).role ?? ''),
    platformAdmin: Boolean((r as { platformAdmin?: boolean }).platformAdmin),
    createdAt: (r as { createdAt?: Date }).createdAt,
  }));
}

export function isValidObjectIdString(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}
