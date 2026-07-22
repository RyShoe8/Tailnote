import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import { findOrgTemplateWithAvailablePreset } from '@/lib/templates/validateOrgTemplate';
import { assertHasDashboardAccess } from '@/lib/dashboard/requireDashboardAccess';

type SessionUser = { organizationId?: string };

async function requireOrgMember() {
  const session = await getServerSession();
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return { error: NextResponse.json({ error: 'No organization' }, { status: 400 }) };
  }
  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) return { error: NextResponse.json({ error: 'Organization not found' }, { status: 404 }) };
  const accessDenied = assertHasDashboardAccess(org);
  if (accessDenied) return { error: accessDenied };
  return { org, user };
}

const PatchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  includeAnimationSlot: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = await requireOrgMember();
  if ('error' in ctx) return ctx.error;
  const { org } = ctx;
  const { id } = await context.params;

  const template = await SignatureTemplateModel.findOne({ _id: id, organizationId: org._id });
  if (!template) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const available = await findOrgTemplateWithAvailablePreset(id, org._id);
  if (!available) {
    return NextResponse.json({ error: 'Template preset is not available' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.name !== undefined) template.name = parsed.data.name.trim();
  if (parsed.data.includeAnimationSlot !== undefined) {
    template.includeAnimationSlot =
      getBillingEntitlements(org).canUseTemplateAnimationSlot && parsed.data.includeAnimationSlot;
  }

  await template.save();
  return NextResponse.json({ template: template.toObject() });
}
