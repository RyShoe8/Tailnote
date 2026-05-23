import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import { assignOrganizationPlan } from '@/lib/admin/assignOrganizationPlan';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { isValidObjectIdString } from '@/lib/admin/data';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { OrganizationSubscriptionModel } from '@/models/OrganizationSubscription';
import { SubscriptionPlanModel } from '@/models/SubscriptionPlan';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  subscriptionPlanId: z.union([z.string(), z.null()]).optional(),
  /** @deprecated Use subscriptionPlanId. Maps slug to latest non-archived plan document. */
  plan: z.enum(['none', 'basic', 'pro']).optional(),
  subscriptionStatus: z
    .enum(['none', 'active', 'trialing', 'past_due', 'canceled', 'incomplete'])
    .optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

async function resolvePlanIdFromLegacySlug(slug: string): Promise<mongoose.Types.ObjectId | null> {
  if (slug === 'none') return null;
  const plan = await SubscriptionPlanModel.findOne({ slug, archived: false })
    .sort({ version: -1 })
    .select('_id')
    .lean<{ _id: mongoose.Types.ObjectId }>();
  return plan?._id ?? null;
}

async function clearOrganizationPlan(orgId: mongoose.Types.ObjectId, subscriptionStatus?: string) {
  await OrganizationModel.findByIdAndUpdate(orgId, {
    $set: {
      plan: 'none',
      subscriptionStatus: subscriptionStatus ?? 'none',
    },
  });
  await OrganizationSubscriptionModel.findOneAndUpdate(
    { organizationId: orgId },
    {
      $set: {
        status: 'canceled',
        grandfathered: true,
      },
    }
  );
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectIdString(id)) {
    return NextResponse.json({ error: 'Invalid organization id' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(' ') }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  await connectMongoose();
  const orgId = new mongoose.Types.ObjectId(id);
  const orgExists = await OrganizationModel.findById(orgId).select('_id').lean();
  if (!orgExists) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  try {
    if (parsed.data.subscriptionPlanId !== undefined) {
      const raw = parsed.data.subscriptionPlanId;
      if (raw === null || raw === '') {
        await clearOrganizationPlan(orgId, parsed.data.subscriptionStatus);
      } else {
        if (!isValidObjectIdString(raw)) {
          return NextResponse.json({ error: 'Invalid subscriptionPlanId' }, { status: 400 });
        }
        await assignOrganizationPlan(orgId, new mongoose.Types.ObjectId(raw), parsed.data.subscriptionStatus);
      }
    } else if (parsed.data.plan !== undefined) {
      const planId = await resolvePlanIdFromLegacySlug(parsed.data.plan);
      if (planId) {
        await assignOrganizationPlan(orgId, planId, parsed.data.subscriptionStatus);
      } else {
        await clearOrganizationPlan(orgId, parsed.data.subscriptionStatus);
      }
    } else if (parsed.data.subscriptionStatus !== undefined) {
      await OrganizationModel.findByIdAndUpdate(orgId, {
        $set: { subscriptionStatus: parsed.data.subscriptionStatus },
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const organization = await OrganizationModel.findById(orgId).lean();
  const orgSubscription = await OrganizationSubscriptionModel.findOne({ organizationId: orgId })
    .populate('subscriptionPlanId')
    .lean();

  return NextResponse.json({ organization, organizationSubscription: orgSubscription });
}
