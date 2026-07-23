import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { EmployeeModel } from '@/models/Employee';
import { findOrgTemplateWithAvailablePreset } from '@/lib/templates/validateOrgTemplate';
import { syncStripeSubscriptionSeatsForOrganization } from '@/lib/stripe/syncSubscriptionSeats';
import { requireOrgAdmin } from '@/lib/dashboard/requireOrgAdmin';
import { getOrgOwnerUser } from '@/lib/org/getOrgOwnerUser';
import {
  isOrgAdminRole,
  memberCanEditPromoBlocks,
  orgPermissionFlags,
} from '@/lib/org/permissions';
import { ContentBlockSchema, sanitizeContentBlocksForSave } from '@/lib/quotes/contentBlockSchema';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import type { ContentBlockData } from 'emailsignature-engine';

type SessionUser = { organizationId?: string; id?: string; role?: string };

async function requireOrg() {
  const session = await getServerSession();
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return { error: NextResponse.json({ error: 'No organization' }, { status: 400 }) };
  }
  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) return { error: NextResponse.json({ error: 'Organization not found' }, { status: 404 }) };
  return { org, user };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }
  try {
    await connectMongoose();
    const employee = await EmployeeModel.findOne({
      _id: id,
      organizationId: user.organizationId,
    }).lean<{ userId?: string } | null>();
    if (!employee) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const owner = await getOrgOwnerUser(user.organizationId);
    const employeeUserId = employee.userId ? String(employee.userId) : '';
    const isOwnerEmployee = Boolean(
      owner?.id && employeeUserId && String(owner.id) === employeeUserId
    );
    return NextResponse.json({
      employee,
      isOwnerEmployee,
      viewer: {
        id: user.id ?? '',
        email: (session.user as { email?: string }).email ?? '',
        role: user.role ?? 'member',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

const PatchSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  title: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  avatarUrl: z.string().optional(),
  templateId: z.string().optional(),
  contentBlocks: z.array(ContentBlockSchema).max(2).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = await requireOrg();
  if ('error' in ctx) return ctx.error;
  const { org } = ctx;
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const session = await getServerSession();
  const sessionUser = (session?.user ?? {}) as SessionUser;

  let employee;
  try {
    employee = await EmployeeModel.findOne({ _id: id, organizationId: org._id });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!employee) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
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

  const orgDoc = await OrganizationModel.findById(org._id);
  const flags = orgDoc ? orgPermissionFlags(orgDoc) : orgPermissionFlags(org);
  const canEditPromo = memberCanEditPromoBlocks(sessionUser.role, flags);
  const body = json as Record<string, unknown>;
  const sendsBlocks = Object.prototype.hasOwnProperty.call(body, 'contentBlocks');
  const sendsTemplate = Object.prototype.hasOwnProperty.call(body, 'templateId');

  if (!isOrgAdminRole(sessionUser.role)) {
    if (String(employee.userId) !== String(sessionUser.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!canEditPromo && (sendsBlocks || sendsTemplate)) {
      return NextResponse.json(
        { error: 'Your organization owner has locked promotional blocks and templates' },
        { status: 403 }
      );
    }
  }

  if (parsed.data.templateId) {
    const t = await findOrgTemplateWithAvailablePreset(parsed.data.templateId, org._id);
    if (!t) {
      return NextResponse.json({ error: 'Invalid or unavailable template' }, { status: 400 });
    }
    employee.templateId = t._id as typeof employee.templateId;
  }

  const data = parsed.data;
  if (data.firstName !== undefined) employee.firstName = data.firstName.trim();
  if (data.lastName !== undefined) employee.lastName = data.lastName.trim();
  if (data.title !== undefined) employee.title = data.title.trim();
  if (data.email !== undefined) employee.email = data.email.trim().toLowerCase();
  if (data.phone !== undefined) employee.phone = data.phone.trim();
  if (data.website !== undefined) employee.website = data.website.trim();
  if (data.linkedin !== undefined) employee.linkedin = data.linkedin.trim();
  if (data.twitter !== undefined) employee.twitter = data.twitter.trim();
  if (data.avatarUrl !== undefined) employee.avatarUrl = data.avatarUrl.trim();
  if (data.contentBlocks !== undefined && canEditPromo) {
    const wantsDynamic = (data.contentBlocks as ContentBlockData[]).some(
      (b) => b.enabled && (b.type === 'dynamic_content' || b.type === 'latest_blogs')
    );
    if (wantsDynamic && !getBillingEntitlements(orgDoc ?? org).canUseDynamicContent) {
      return NextResponse.json(
        { error: 'Dynamic Content is available on paid plans' },
        { status: 402 }
      );
    }
    const sanitized = sanitizeContentBlocksForSave(data.contentBlocks as ContentBlockData[]);
    (employee as unknown as { contentBlocks: unknown }).contentBlocks = sanitized;
    if (!isOrgAdminRole(sessionUser.role)) {
      (employee as unknown as { promoBlocksCustomized: boolean }).promoBlocksCustomized = true;

    }
  }

  await employee.save();
  return NextResponse.json({ employee: employee.toObject() });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = await requireOrgAdmin();
  if ('error' in ctx) return ctx.error;
  const { org, user } = ctx;
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const owner = await getOrgOwnerUser(org._id);
  const employee = await EmployeeModel.findOne({
    _id: id,
    organizationId: user.organizationId,
  }).lean<{ userId?: string } | null>();
  if (!employee) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (owner?.id && employee.userId && String(employee.userId) === String(owner.id)) {
    return NextResponse.json(
      { error: 'The account owner cannot be deleted. Remove their user account instead.' },
      { status: 400 }
    );
  }

  const res = await EmployeeModel.deleteOne({ _id: id, organizationId: user.organizationId });
  if (res.deletedCount === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  void syncStripeSubscriptionSeatsForOrganization(org._id.toString()).catch(() => {});
  return NextResponse.json({ ok: true });
}
