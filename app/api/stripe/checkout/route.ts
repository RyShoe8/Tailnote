import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import {
  checkoutErrorToResponse,
  createCheckoutSessionForOrganization,
} from '@/lib/billing/createCheckoutSession';

const BodySchema = z
  .object({
    plan: z.enum(['basic', 'pro']).optional(),
    subscriptionPlanId: z.string().optional(),
  })
  .refine((b) => b.plan !== undefined || Boolean(b.subscriptionPlanId?.trim()), {
    message: 'Provide plan (basic|pro) or subscriptionPlanId',
  });

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as { id: string; email?: string; organizationId?: string };
  if (!user.organizationId) {
    return NextResponse.json({ error: 'Create an organization first' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await connectMongoose();
    const org = await OrganizationModel.findById(user.organizationId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { url } = await createCheckoutSessionForOrganization({
      org,
      userEmail: user.email,
      subscriptionPlanId: parsed.data.subscriptionPlanId,
      planSlug: parsed.data.plan,
    });

    return NextResponse.json({ url });
  } catch (err) {
    return checkoutErrorToResponse(err);
  }
}
