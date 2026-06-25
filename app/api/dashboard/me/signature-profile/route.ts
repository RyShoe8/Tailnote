import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { ContentBlockData } from 'emailsignature-engine';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { UserSignatureProfileModel } from '@/models/UserSignatureProfile';
import { OrganizationModel } from '@/models/Organization';
import { EmployeeModel } from '@/models/Employee';
import { findOrgTemplateWithAvailablePreset } from '@/lib/templates/validateOrgTemplate';
import { syncOwnerEmployeeFromProfile } from '@/lib/employees/syncOwnerEmployeeFromProfile';
import { syncPromoBlocksToLockedMembers } from '@/lib/employees/syncPromoBlocksToLockedMembers';
import {
  isOrgAdminRole,
  memberCanEditPromoBlocks,
  orgPermissionFlags,
} from '@/lib/org/permissions';
import { resolveEmployeeContentBlocks } from '@/lib/org/resolveEmployeeContentBlocks';
import { ContentBlocksArraySchema, sanitizeContentBlocksForSave } from '@/lib/quotes/contentBlockSchema';

const ProfileSchema = z.object({
  firstName: z.string().trim().max(120),
  lastName: z.string().trim().max(120),
  title: z.string().trim().max(200),
  email: z.string().trim().email().max(320),
  officePhone: z.string().trim().max(80).optional(),
  mobilePhone: z.string().trim().max(80).optional(),
  contentBlocks: ContentBlocksArraySchema.optional(),
  templateId: z.string().min(1).optional(),
});

type SessionUser = {
  id?: string;
  organizationId?: string;
  role?: string;
  email?: string;
  name?: string | null;
};

function docToProfile(doc: {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  officePhone?: string;
  mobilePhone?: string;
  templateId?: unknown;
  contentBlocks?: unknown[];
}) {
  const templateId =
    doc.templateId != null && String(doc.templateId).length > 0
      ? String(doc.templateId)
      : undefined;
  return {
    firstName: doc.firstName,
    lastName: doc.lastName,
    title: doc.title,
    email: doc.email,
    officePhone: doc.officePhone ?? '',
    mobilePhone: doc.mobilePhone ?? '',
    contentBlocks: doc.contentBlocks ?? [],
    ...(templateId ? { templateId } : {}),
  };
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ profile: null });
  }

  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId).lean();
  if (!org) {
    return NextResponse.json({ profile: null });
  }

  const row = await UserSignatureProfileModel.findOne({ userId: user.id }).lean();
  const orgLean = org as unknown as import('@/models/Organization').OrganizationDoc;
  const flags = orgPermissionFlags(orgLean);
  const canEditPromo = memberCanEditPromoBlocks(user.role, flags);

  let contentBlocks: ContentBlockData[] = (row as { contentBlocks?: unknown[] } | null)?.contentBlocks as ContentBlockData[] ?? [];

  if (!isOrgAdminRole(user.role)) {
    const emp = await EmployeeModel.findOne({
      organizationId: orgLean._id,
      userId: user.id,
    }).lean();
    if (emp) {
      contentBlocks = await resolveEmployeeContentBlocks(orgLean, emp as unknown as import('@/models/Employee').EmployeeDoc);
    } else if (!canEditPromo) {
      const { getOrgOwnerPromoBlocks } = await import('@/lib/org/getOrgOwnerPromoBlocks');
      contentBlocks = await getOrgOwnerPromoBlocks(orgLean._id);
    }
  }

  if (!row) {
    return NextResponse.json({
      profile: null,
      permissions: flags,
      promoBlocksEditable: canEditPromo,
    });
  }

  return NextResponse.json({
    profile: {
      ...docToProfile(row as never),
      contentBlocks,
    },
    permissions: flags,
    promoBlocksEditable: canEditPromo,
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = ProfileSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(' ') }, { status: 400 });
  }

  const p = parsed.data;
  await connectMongoose();

  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const orgLean = org as unknown as import('@/models/Organization').OrganizationDoc;
  const flags = orgPermissionFlags(orgLean);
  const canEditPromo = memberCanEditPromoBlocks(user.role, flags);
  const body = json as Record<string, unknown>;
  const sendsBlocks = Object.prototype.hasOwnProperty.call(body, 'contentBlocks');
  const sendsTemplate = Object.prototype.hasOwnProperty.call(body, 'templateId');

  if (!canEditPromo && (sendsBlocks || sendsTemplate)) {
    return NextResponse.json(
      { error: 'Your organization owner has locked promotional blocks and templates' },
      { status: 403 }
    );
  }

  let templateObjectId: import('mongoose').Types.ObjectId | undefined;
  if (p.templateId) {
    const tmpl = await findOrgTemplateWithAvailablePreset(p.templateId, user.organizationId);
    if (!tmpl) {
      return NextResponse.json({ error: 'Invalid or unavailable template' }, { status: 400 });
    }
    templateObjectId = tmpl._id;
  }

  const existingProfile = await UserSignatureProfileModel.findOne({ userId: user.id }).lean();
  const contentBlocksForUpdate =
    sendsBlocks && canEditPromo
      ? sanitizeContentBlocksForSave((p.contentBlocks ?? []) as ContentBlockData[])
      : ((existingProfile as { contentBlocks?: unknown[] } | null)?.contentBlocks ?? []);

  const update: Record<string, unknown> = {
    userId: user.id,
    firstName: p.firstName,
    lastName: p.lastName,
    title: p.title,
    email: p.email,
    officePhone: p.officePhone ?? '',
    mobilePhone: p.mobilePhone ?? '',
    contentBlocks: contentBlocksForUpdate,
  };
  if (templateObjectId && canEditPromo) {
    update.templateId = templateObjectId;
  }

  const row = await UserSignatureProfileModel.findOneAndUpdate(
    { userId: user.id },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  if (!row) {
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }

  const isOwner = user.role === 'owner';
  const blocksPayload = sendsBlocks && canEditPromo
    ? sanitizeContentBlocksForSave((p.contentBlocks ?? []) as ContentBlockData[])
    : undefined;

  if (user.id && user.email) {
    await syncOwnerEmployeeFromProfile(
      user.organizationId,
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      {
        firstName: p.firstName,
        lastName: p.lastName,
        title: p.title,
        email: p.email,
        officePhone: p.officePhone,
        mobilePhone: p.mobilePhone,
        contentBlocks: blocksPayload,
        templateId: templateObjectId && canEditPromo ? String(templateObjectId) : p.templateId,
      }
    );
  }

  if (user.role === 'member' && sendsBlocks && canEditPromo) {
    await EmployeeModel.updateOne(
      { organizationId: orgLean._id, userId: user.id },
      { $set: { promoBlocksCustomized: true } }
    );
  }

  if (isOwner && sendsBlocks && blocksPayload && !flags.employeesCanEditPromoBlocks) {
    await syncPromoBlocksToLockedMembers(orgLean._id, blocksPayload);
  }

  const emp = await EmployeeModel.findOne({ organizationId: orgLean._id, userId: user.id }).lean();
  const resolvedBlocks = emp
    ? await resolveEmployeeContentBlocks(orgLean, emp as unknown as import('@/models/Employee').EmployeeDoc)
    : ((row as { contentBlocks?: unknown[] }).contentBlocks as ContentBlockData[]);

  return NextResponse.json({
    profile: {
      ...docToProfile(row as never),
      contentBlocks: resolvedBlocks,
    },
    permissions: flags,
    promoBlocksEditable: canEditPromo,
  });
}
