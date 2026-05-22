import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { OrganizationSubscriptionModel } from '@/models/OrganizationSubscription';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { isValidObjectIdString } from '@/lib/admin/data';
import {
  checkoutErrorToResponse,
  createCheckoutSessionForOrganization,
  validatePlanForCheckout,
  CheckoutSessionError,
} from '@/lib/billing/createCheckoutSession';
import { stripeBillingEnabled } from '@/lib/billing/subscriptionAccess';
import { getAppBaseUrl } from '@/lib/email/appUrl';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  subscriptionPlanId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    if (!stripeBillingEnabled()) {
      return NextResponse.json({ error: 'Billing is not configured' }, { status: 503 });
    }

    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id: string; email?: string; organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'Create an organization first' }, { status: 400 });
    }
    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Only the organization owner can subscribe' }, { status: 403 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(' ');
      return NextResponse.json({ error: message || 'Invalid request' }, { status: 400 });
    }

    const planId = parsed.data.subscriptionPlanId.trim();
    if (!isValidObjectIdString(planId)) {
      return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
    }

    await connectMongoose();
    const org = await OrganizationModel.findById(user.organizationId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const dbPlan = await SubscriptionPlanModel.findById(planId).lean<SubscriptionPlanDoc>();
    if (!dbPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    try {
      await validatePlanForCheckout(dbPlan, org._id.toString());
    } catch (e) {
      if (e instanceof CheckoutSessionError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      throw e;
    }

    await OrganizationSubscriptionModel.findOneAndUpdate(
      { organizationId: org._id },
      {
        $set: {
          subscriptionPlanId: new mongoose.Types.ObjectId(planId),
          status: 'incomplete',
        },
      },
      { upsert: true }
    );

    const base = getAppBaseUrl();
    const { url: checkoutUrl } = await createCheckoutSessionForOrganization({
      org,
      userEmail: user.email,
      subscriptionPlanId: planId,
      successUrl: `${base}/dashboard?checkout=success`,
      cancelUrl: `${base}/onboarding?checkout=cancelled`,
    });

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    return checkoutErrorToResponse(err);
  }
}
