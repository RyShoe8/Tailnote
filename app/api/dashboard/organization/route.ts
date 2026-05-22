import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { unsetLegacyOrgAddressFields } from '@/lib/org/unsetLegacyOrgAddressFields';
import {
  isAllowedOrgLogoUrl,
  orgLogoUrlValidationMessage,
} from '@/lib/org/validateOrgLogoUrl';

type SessionUser = {
  id?: string;
  organizationId?: string;
  role?: string;
};

const PATCHABLE_FIELDS = [
  'name',
  'logoUrl',
  'logoShape',
  'primaryColor',
  'secondaryColor',
  'website',
  'companyName',
  'fontFamily',
  'logoLink',
  'socialLinks',
  'address',
  'state',
  'zip',
  'animation',
  'signatureClickTrackingEnabled',
  'utmEnabled',
] as const;

type PatchableField = (typeof PATCHABLE_FIELDS)[number];

function isPatchableField(key: string): key is PatchableField {
  return (PATCHABLE_FIELDS as readonly string[]).includes(key);
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ organization: null });
  }
  await connectMongoose();
  await unsetLegacyOrgAddressFields(user.organizationId);
  const organization = await OrganizationModel.findById(user.organizationId).lean();
  return NextResponse.json({
    organization,
    viewer: { role: user.role ?? 'member' },
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }
  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  if (user.role !== 'owner' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const $set: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (!isPatchableField(key)) continue;
    const value = body[key];
    if (value !== undefined) {
      $set[key] = value;
    }
  }

  await unsetLegacyOrgAddressFields(user.organizationId);

  if ($set.logoUrl !== undefined) {
    const nextLogoUrl = String($set.logoUrl ?? '').trim();
    if (nextLogoUrl && !isAllowedOrgLogoUrl(nextLogoUrl, user.organizationId)) {
      return NextResponse.json({ error: orgLogoUrlValidationMessage() }, { status: 400 });
    }
    $set.logoUrl = nextLogoUrl;
  }

  if ($set.logoShape !== undefined) {
    const shape = String($set.logoShape);
    if (shape !== 'rectangle' && shape !== 'circle') {
      return NextResponse.json({ error: 'logoShape must be rectangle or circle' }, { status: 400 });
    }
    $set.logoShape = shape;
  }

  if (Object.keys($set).length === 0) {
    const current = await OrganizationModel.findById(user.organizationId).lean();
    return NextResponse.json({ organization: current });
  }

  const updated = await OrganizationModel.findByIdAndUpdate(user.organizationId, { $set }, { new: true }).lean();
  if (!updated) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  return NextResponse.json({ organization: updated });
}
