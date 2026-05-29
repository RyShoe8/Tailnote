import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { isValidObjectIdString } from '@/lib/admin/data';
import { AdminPlanForm } from '@/components/admin/AdminPlanForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function EditAdminPlanPage({ params }: Props) {
  const { id } = await params;
  if (!isValidObjectIdString(id)) notFound();
  await connectMongoose();
  const p = await SubscriptionPlanModel.findById(id).lean<SubscriptionPlanDoc>();
  if (!p) notFound();

  const initial = {
    name: String(p.name ?? ''),
    interval: (p.interval as 'month' | 'year' | 'lifetime') ?? 'year',
    basePriceCents: Number(p.basePriceCents ?? 0),
    additionalUserPriceCents: Number(p.additionalUserPriceCents ?? 0),
    includedUsers: Number(p.includedUsers ?? 1),
    description: String(p.description ?? ''),
    badge: String(p.badge ?? ''),
    maxSubscriptionSlots: Number(p.maxSubscriptionSlots ?? 0),
    listOnPricingPage: p.listOnPricingPage !== false,
    trialDays: Number(p.trialDays ?? 0),
  };

  const backHref = p.archived ? '/admin/plans/archived' : '/admin/plans';

  return (
    <div className="space-y-6">
      <Link href={backHref} className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
        ← {p.archived ? 'Archived plans' : 'Plans'}
      </Link>
      <AdminPlanForm mode="edit" planId={id} initial={initial} />
    </div>
  );
}
