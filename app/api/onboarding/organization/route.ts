import '@/lib/billing-engine';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { logError } from '@/lib/logger';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { OrganizationSubscriptionModel } from '@/models/OrganizationSubscription';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { seedDefaultTemplates } from '@/lib/seedOrgTemplates';
import { ensureOwnerEmployee } from '@/lib/employees/ensureOwnerEmployee';
import { isValidObjectIdString } from '@/lib/admin/data';
import {
  legacyOrganizationSlugIndexMessage,
  mapLegacyOrganizationSlugIndexError,
} from '@/lib/admin/mongoErrors';
import {
  assignOrganizationPlan,
  createCheckoutSessionForOrganization,
  isFreemiumSubscriptionPlan,
  shouldAssignPlanWithoutCheckout,
  validatePlanForCheckout,
  CheckoutSessionError,
} from 'billing-engine';
import { stripeBillingEnabled } from 'billing-engine';
import { linkUserToOrganization } from '@/lib/onboarding/linkUserToOrganization';
import { getAppBaseUrl } from '@/lib/email/appUrl';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  name: z.string().min(1).max(120),
  subscriptionPlanId: z.string().min(1),
});

async function rollbackOrg(orgId: mongoose.Types.ObjectId) {
  await OrganizationSubscriptionModel.deleteMany({ organizationId: orgId });
  await SignatureTemplateModel.deleteMany({ organizationId: orgId });
  await OrganizationModel.findByIdAndDelete(orgId);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as {
      id: string;
      email?: string;
      name?: string | null;
      organizationId?: string;
    };
    if (user.organizationId) {
      return NextResponse.json({ error: 'Organization already exists' }, { status: 400 });
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

    const dbPlan = await SubscriptionPlanModel.findById(planId).lean<SubscriptionPlanDoc>();
    if (!dbPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const assignWithoutCheckout = shouldAssignPlanWithoutCheckout(dbPlan);
    const isFreemium = isFreemiumSubscriptionPlan(dbPlan);

    if (!assignWithoutCheckout) {
      if (!stripeBillingEnabled()) {
        return NextResponse.json({ error: 'Billing is not configured' }, { status: 503 });
      }
      try {
        await validatePlanForCheckout(dbPlan);
      } catch (e) {
        if (e instanceof CheckoutSessionError) {
          return NextResponse.json({ error: e.message }, { status: e.status });
        }
        throw e;
      }
    }

    let org;
    try {
      org = await OrganizationModel.create({
        name: parsed.data.name,
        companyName: parsed.data.name,
        subscriptionStatus: isFreemium ? 'none' : assignWithoutCheckout ? 'active' : 'incomplete',
        plan: isFreemium ? 'free' : assignWithoutCheckout ? String(dbPlan.slug) : 'none',
      });
    } catch (err) {
      const legacySlug = mapLegacyOrganizationSlugIndexError(err);
      if (legacySlug) {
        return NextResponse.json({ error: legacyOrganizationSlugIndexMessage() }, { status: 503 });
      }
      throw err;
    }

    try {
      await seedDefaultTemplates(org._id);

      await linkUserToOrganization(user.id, org._id.toString(), 'owner');

      await OrganizationSubscriptionModel.findOneAndUpdate(
        { organizationId: org._id },
        {
          $set: {
            subscriptionPlanId: new mongoose.Types.ObjectId(planId),
            status: 'incomplete',
            seats: 1,
          },
        },
        { upsert: true }
      );

      if (user.email) {
        await ensureOwnerEmployee(org._id, {
          id: user.id,
          email: user.email,
          name: user.name,
        });
      }

      if (assignWithoutCheckout && !isFreemium) {
        await assignOrganizationPlan(org._id, new mongoose.Types.ObjectId(planId), 'active');
      }

      const base = getAppBaseUrl();
      const checkoutUrl = assignWithoutCheckout
        ? `${base}/dashboard`
        : (
            await createCheckoutSessionForOrganization({
              org,
              userEmail: user.email,
              subscriptionPlanId: planId,
              successUrl: `${base}/dashboard?checkout=success`,
              cancelUrl: `${base}/onboarding?checkout=cancelled`,
            })
          ).url;

      return NextResponse.json({ organization: org.toObject(), checkoutUrl });
    } catch (err) {
      logError('api/onboarding/organization', err);
      await rollbackOrg(org._id);
      const legacySlug = mapLegacyOrganizationSlugIndexError(err);
      const message = legacySlug
        ? legacyOrganizationSlugIndexMessage()
        : err instanceof CheckoutSessionError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not create organization';
      const status = legacySlug
        ? 503
        : err instanceof CheckoutSessionError
          ? err.status
          : 500;
      return NextResponse.json({ error: message }, { status });
    }
  } catch (err) {
    logError('api/onboarding/organization', err);
    const legacySlug = mapLegacyOrganizationSlugIndexError(err);
    if (legacySlug) {
      return NextResponse.json({ error: legacyOrganizationSlugIndexMessage() }, { status: 503 });
    }
    return NextResponse.json({ error: 'Could not create organization' }, { status: 500 });
  }
}
