import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { UserSignatureProfileModel } from '@/models/UserSignatureProfile';
import { findOrgTemplateWithAvailablePreset } from '@/lib/templates/validateOrgTemplate';
import { syncOwnerEmployeeFromProfile } from '@/lib/employees/syncOwnerEmployeeFromProfile';

const ProfileSchema = z.object({
  firstName: z.string().trim().max(120),
  lastName: z.string().trim().max(120),
  title: z.string().trim().max(200),
  email: z.string().trim().email().max(320),
  officePhone: z.string().trim().max(80).optional(),
  mobilePhone: z.string().trim().max(80).optional(),
  contentBlocks: z.array(z.any()).optional(),
  templateId: z.string().min(1).optional(),
});

type SessionUser = {
  id?: string;
  organizationId?: string;
};

function docToProfile(doc: {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  officePhone?: string;
  mobilePhone?: string;
  templateId?: unknown;
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
    contentBlocks: (doc as { contentBlocks?: unknown[] }).contentBlocks ?? [],
    ...(templateId ? { templateId } : {}),
  };
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;

  await connectMongoose();
  const row = await UserSignatureProfileModel.findOne({ userId: user.id }).lean();
  if (!row) {
    return NextResponse.json({ profile: null });
  }
  return NextResponse.json({ profile: docToProfile(row) });
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

  let templateObjectId: import('mongoose').Types.ObjectId | undefined;
  if (p.templateId) {
    const tmpl = await findOrgTemplateWithAvailablePreset(p.templateId, user.organizationId);
    if (!tmpl) {
      return NextResponse.json({ error: 'Invalid or unavailable template' }, { status: 400 });
    }
    templateObjectId = tmpl._id;
  }

  const update: Record<string, unknown> = {
    userId: user.id,
    firstName: p.firstName,
    lastName: p.lastName,
    title: p.title,
    email: p.email,
    officePhone: p.officePhone ?? '',
    mobilePhone: p.mobilePhone ?? '',
    contentBlocks: p.contentBlocks ?? [],
  };
  if (templateObjectId) {
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

  const owner = session.user as { id?: string; email?: string; name?: string | null };
  if (owner.id && owner.email) {
    await syncOwnerEmployeeFromProfile(user.organizationId, {
      id: owner.id,
      email: owner.email,
      name: owner.name,
    }, {
      firstName: p.firstName,
      lastName: p.lastName,
      title: p.title,
      email: p.email,
      officePhone: p.officePhone,
      mobilePhone: p.mobilePhone,
      contentBlocks: p.contentBlocks as import('emailsignature-engine').ContentBlockData[] | undefined,
      templateId: templateObjectId ? String(templateObjectId) : p.templateId,
    });
  }

  return NextResponse.json({ profile: docToProfile(row) });
}
