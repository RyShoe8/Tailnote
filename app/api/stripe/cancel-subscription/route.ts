import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { requireOwnerWithStripeSubscription } from '@/lib/billing/requireOwnerSubscription';
import { OrganizationSubscriptionModel } from '@/models/OrganizationSubscription';
import { getStripe } from '@/lib/stripe/client';

export async function POST() {
  const gate = await requireOwnerWithStripeSubscription();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { org, organizationId } = gate.ctx;
  const subId = org.stripeSubscriptionId!.trim();

  const stripe = getStripe();
  const sub = await stripe.subscriptions.update(subId, {
    cancel_at_period_end: true,
  });

  const endsAt =
    typeof sub.current_period_end === 'number'
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;

  await connectMongoose();
  const orgObjId = new mongoose.Types.ObjectId(organizationId);
  const patch: Record<string, unknown> = {
    cancelAtPeriodEnd: true,
  };
  if (endsAt) patch.renewsAt = new Date(endsAt);

  await OrganizationSubscriptionModel.findOneAndUpdate(
    { organizationId: orgObjId },
    { $set: patch }
  );

  return NextResponse.json({
    cancelAtPeriodEnd: true,
    endsAt,
  });
}
