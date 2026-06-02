import mongoose from 'mongoose';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import { AUTH_USER_COLLECTION } from '@/lib/auth/platformAdmin';
import { EmployeeModel } from '@/models/Employee';
import { OrganizationModel } from '@/models/Organization';
import { SignatureClickEventModel } from '@/models/SignatureClickEvent';
import { SignatureCopyEventModel } from '@/models/SignatureCopyEvent';
import { SignatureOpenEventModel } from '@/models/SignatureOpenEvent';
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

export type AdminAnalyticsSummary = {
  totalOrganizations: number;
  totalUsers: number;
  mrrCents: number;
  arrCents: number;
  totalSignatureCopies: number;
  totalSignatureClicks: number;
  totalSignatureOpens: number;
};

export type AdminAnalyticsMetric =
  | 'organizations'
  | 'users'
  | 'mrr'
  | 'arr'
  | 'copies'
  | 'clicks'
  | 'opens';

export type AdminAnalyticsGroupBy = 'day' | 'week' | 'month';

export type AdminAnalyticsSeriesPoint = {
  date: string;
  value: number;
};

function recurringMonthlyCentsForSubscription(
  sub: { seats?: number },
  plan: Pick<SubscriptionPlanDoc, 'interval' | 'basePriceCents' | 'additionalUserPriceCents' | 'includedUsers'>
): number {
  if (plan.interval === 'lifetime') return 0;
  const seats = Math.max(1, Number(sub.seats ?? 1));
  const included = Math.max(1, Number(plan.includedUsers ?? 1));
  const overageSeats = Math.max(0, seats - included);
  const seatOverageCents = overageSeats * Math.max(0, Number(plan.additionalUserPriceCents ?? 0));
  const totalPeriodCents = Math.max(0, Number(plan.basePriceCents ?? 0)) + seatOverageCents;

  if (plan.interval === 'year') {
    return Math.round(totalPeriodCents / 12);
  }
  return totalPeriodCents;
}

function bucketStart(d: Date, groupBy: AdminAnalyticsGroupBy): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  if (groupBy === 'day') return date;
  if (groupBy === 'month') {
    date.setDate(1);
    return date;
  }
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  return date;
}

function bucketKey(d: Date, groupBy: AdminAnalyticsGroupBy): string {
  const start = bucketStart(d, groupBy);
  if (groupBy === 'month') return start.toISOString().slice(0, 7);
  return start.toISOString().slice(0, 10);
}

function nextBucket(d: Date, groupBy: AdminAnalyticsGroupBy): Date {
  const out = new Date(d);
  if (groupBy === 'day') out.setDate(out.getDate() + 1);
  else if (groupBy === 'week') out.setDate(out.getDate() + 7);
  else out.setMonth(out.getMonth() + 1, 1);
  return out;
}

function fillEmptyBuckets(
  byBucket: Map<string, number>,
  from: Date,
  to: Date,
  groupBy: AdminAnalyticsGroupBy
): AdminAnalyticsSeriesPoint[] {
  const points: AdminAnalyticsSeriesPoint[] = [];
  let cursor = bucketStart(from, groupBy);
  const end = bucketStart(to, groupBy);
  while (cursor <= end) {
    const key = bucketKey(cursor, groupBy);
    points.push({ date: key, value: byBucket.get(key) ?? 0 });
    cursor = nextBucket(cursor, groupBy);
  }
  return points;
}

function clampRange(args: { from: Date; to: Date; maxDays?: number }): { from: Date; to: Date } {
  const maxDays = args.maxDays ?? 365;
  let from = new Date(args.from);
  let to = new Date(args.to);
  if (Number.isNaN(from.getTime())) from = new Date(Date.now() - 30 * 864e5);
  if (Number.isNaN(to.getTime())) to = new Date();
  if (from > to) {
    const tmp = from;
    from = to;
    to = tmp;
  }
  const span = to.getTime() - from.getTime();
  const maxSpan = maxDays * 864e5;
  if (span > maxSpan) {
    from = new Date(to.getTime() - maxSpan);
  }
  return { from, to };
}

export async function getAdminAnalyticsSummary(): Promise<AdminAnalyticsSummary> {
  await connectMongoose();

  const [totalOrganizations, totalUsers, totalSignatureCopies, totalSignatureClicks, totalSignatureOpens, activeSubs] =
    await Promise.all([
      OrganizationModel.countDocuments(),
      EmployeeModel.countDocuments(),
      SignatureCopyEventModel.countDocuments(),
      SignatureClickEventModel.countDocuments(),
      SignatureOpenEventModel.countDocuments(),
      OrganizationSubscriptionModel.find({ status: { $in: ['active', 'trialing'] } })
        .populate('subscriptionPlanId')
        .lean<Array<{ seats?: number; subscriptionPlanId?: SubscriptionPlanDoc | null }>>(),
    ]);

  const mrrCents = activeSubs.reduce((sum, sub) => {
    const plan = sub.subscriptionPlanId;
    if (!plan) return sum;
    return sum + recurringMonthlyCentsForSubscription(sub, plan);
  }, 0);

  return {
    totalOrganizations,
    totalUsers,
    mrrCents,
    arrCents: mrrCents * 12,
    totalSignatureCopies,
    totalSignatureClicks,
    totalSignatureOpens,
  };
}

export async function getAdminAnalyticsSeries(args: {
  metric: AdminAnalyticsMetric;
  from: Date;
  to: Date;
  groupBy: AdminAnalyticsGroupBy;
}): Promise<AdminAnalyticsSeriesPoint[]> {
  await connectMongoose();
  const { from, to } = clampRange({ from: args.from, to: args.to });
  const groupBy = args.groupBy;
  const byBucket = new Map<string, number>();

  const match = { createdAt: { $gte: from, $lte: to } };

  if (args.metric === 'organizations') {
    const rows = await OrganizationModel.find(match).select('createdAt').lean<{ createdAt?: Date }[]>();
    for (const row of rows) {
      if (!row.createdAt) continue;
      const key = bucketKey(new Date(row.createdAt), groupBy);
      byBucket.set(key, (byBucket.get(key) ?? 0) + 1);
    }
    return fillEmptyBuckets(byBucket, from, to, groupBy);
  }

  if (args.metric === 'users') {
    const rows = await EmployeeModel.find(match).select('createdAt').lean<{ createdAt?: Date }[]>();
    for (const row of rows) {
      if (!row.createdAt) continue;
      const key = bucketKey(new Date(row.createdAt), groupBy);
      byBucket.set(key, (byBucket.get(key) ?? 0) + 1);
    }
    return fillEmptyBuckets(byBucket, from, to, groupBy);
  }

  if (args.metric === 'copies') {
    const rows = await SignatureCopyEventModel.find(match).select('createdAt').lean<{ createdAt?: Date }[]>();
    for (const row of rows) {
      if (!row.createdAt) continue;
      const key = bucketKey(new Date(row.createdAt), groupBy);
      byBucket.set(key, (byBucket.get(key) ?? 0) + 1);
    }
    return fillEmptyBuckets(byBucket, from, to, groupBy);
  }

  if (args.metric === 'clicks') {
    const rows = await SignatureClickEventModel.find(match).select('createdAt').lean<{ createdAt?: Date }[]>();
    for (const row of rows) {
      if (!row.createdAt) continue;
      const key = bucketKey(new Date(row.createdAt), groupBy);
      byBucket.set(key, (byBucket.get(key) ?? 0) + 1);
    }
    return fillEmptyBuckets(byBucket, from, to, groupBy);
  }

  if (args.metric === 'opens') {
    const rows = await SignatureOpenEventModel.find(match).select('createdAt').lean<{ createdAt?: Date }[]>();
    for (const row of rows) {
      if (!row.createdAt) continue;
      const key = bucketKey(new Date(row.createdAt), groupBy);
      byBucket.set(key, (byBucket.get(key) ?? 0) + 1);
    }
    return fillEmptyBuckets(byBucket, from, to, groupBy);
  }

  const subs = await OrganizationSubscriptionModel.find({
    status: { $in: ['active', 'trialing'] },
    ...match,
  })
    .populate('subscriptionPlanId')
    .lean<Array<{ createdAt?: Date; seats?: number; subscriptionPlanId?: SubscriptionPlanDoc | null }>>();

  for (const sub of subs) {
    if (!sub.createdAt || !sub.subscriptionPlanId) continue;
    const key = bucketKey(new Date(sub.createdAt), groupBy);
    const mrrCents = recurringMonthlyCentsForSubscription(sub, sub.subscriptionPlanId);
    byBucket.set(key, (byBucket.get(key) ?? 0) + mrrCents);
  }

  const points = fillEmptyBuckets(byBucket, from, to, groupBy);
  if (args.metric === 'arr') {
    return points.map((p) => ({ ...p, value: p.value * 12 }));
  }
  return points;
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
