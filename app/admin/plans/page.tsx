import '@/lib/billing-engine';
import Link from 'next/link';
import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { ensureDefaultSubscriptionPlans } from 'billing-engine';
import { getPlanSubscriptionCapUsage } from 'billing-engine';
import { AdminPlansTable, type PlanRow } from 'billing-engine/next/components';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function AdminPlansPage() {
  await connectMongoose();
  await ensureDefaultSubscriptionPlans();
  const raw = await SubscriptionPlanModel.find({ archived: false })
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
        archived: Boolean(p.archived),
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Active plans</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Source of truth for pricing. Sync creates Stripe products and immutable prices.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/plans/new">Create plan</Link>
        </Button>
      </div>
      <AdminPlansTable initialPlans={initialPlans} mode="active" />
    </div>
  );
}
