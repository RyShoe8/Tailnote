import Link from 'next/link';
import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { getPlanSubscriptionCapUsage } from 'billing-engine';
import { AdminPlansTable, type PlanRow } from 'billing-engine/next/components';

export const dynamic = 'force-dynamic';

export default async function AdminArchivedPlansPage() {
  await connectMongoose();
  const raw = await SubscriptionPlanModel.find({ archived: true })
    .sort({ slug: 1, version: -1 })
    .lean<SubscriptionPlanDoc[]>();

  const initialPlans: PlanRow[] = await Promise.all(
    raw.map(async (p) => {
      const usage = await getPlanSubscriptionCapUsage(p);
      return {
        _id: String(p._id),
        name: String(p.name ?? ''),
        slug: String(p.slug ?? ''),
        interval: String(p.interval ?? 'year'),
        basePriceCents: Number(p.basePriceCents ?? 0),
        additionalUserPriceCents: Number(p.additionalUserPriceCents ?? 0),
        includedUsers: Number(p.includedUsers ?? 1),
        active: Boolean(p.active),
        paused: Boolean(p.paused),
        archived: true,
        version: Number(p.version ?? 1),
        stripeBasePriceId: p.stripeBasePriceId ? String(p.stripeBasePriceId) : '',
        maxSubscriptionSlots: Number(p.maxSubscriptionSlots ?? 0),
        subscriptionCount: usage.used,
        soldOut: usage.soldOut,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/plans"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Active plans
        </Link>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">Archived plans</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Retired from public pricing and checkout. Existing organization subscriptions stay on their pinned plan.
        </p>
      </div>
      <AdminPlansTable initialPlans={initialPlans} mode="archived" />
    </div>
  );
}
