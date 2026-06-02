import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { logError } from '@/lib/logger';
import { listOrganizationsWithUserCounts } from '@/lib/admin/data';
import {
  ProvisionOrganizationError,
  provisionOrganization,
} from '@/lib/admin/provisionOrganization';

export const dynamic = 'force-dynamic';

const PostSchema = z.object({
  name: z.string().trim().min(1).max(120),
  subscriptionPlanId: z.string().trim().optional(),
  subscriptionStatus: z
    .enum(['none', 'active', 'trialing', 'past_due', 'canceled', 'incomplete'])
    .optional(),
});

export async function GET() {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const organizations = await listOrganizationsWithUserCounts();
  return NextResponse.json({ organizations });
}

export async function POST(request: Request) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = PostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(' ') },
      { status: 400 }
    );
  }

  try {
    const { organizationId, organization } = await provisionOrganization({
      name: parsed.data.name,
      subscriptionPlanId: parsed.data.subscriptionPlanId || null,
      subscriptionStatus: parsed.data.subscriptionStatus,
    });
    return NextResponse.json({ organizationId, organization }, { status: 201 });
  } catch (err) {
    if (err instanceof ProvisionOrganizationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logError('api/admin/organizations', err);
    return NextResponse.json({ error: 'Could not create organization' }, { status: 500 });
  }
}
