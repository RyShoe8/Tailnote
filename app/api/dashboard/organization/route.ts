import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { unsetLegacyOrgAddressFields } from '@/lib/org/unsetLegacyOrgAddressFields';
import { hasAnalytics } from 'billing-engine';
import {
  isAllowedOrgLogoUrl,
  orgLogoUrlValidationMessage,
} from '@/lib/org/validateOrgLogoUrl';
import {
  isOrgAdminRole,
  memberCanEditOrgBrand,
  orgPermissionFlags,
} from '@/lib/org/permissions';

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
  'city',
  'state',
  'zip',
  'animation',
  'signatureClickTrackingEnabled',
  'signatureOpenTrackingEnabled',
  'utmEnabled',
  'brandOrder',
  'hiddenFields',
] as const;

const OWNER_ONLY_FIELDS = ['employeesCanEditBrand', 'employeesCanEditPromoBlocks'] as const;

const MEMBER_BRAND_FIELDS = [
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
  'city',
  'state',
  'zip',
  'animation',
  'brandOrder',
  'hiddenFields',
] as const;

type PatchableField = (typeof PATCHABLE_FIELDS)[number];
type OwnerOnlyField = (typeof OWNER_ONLY_FIELDS)[number];

function isPatchableField(key: string): key is PatchableField {
  return (PATCHABLE_FIELDS as readonly string[]).includes(key);
}

function isOwnerOnlyField(key: string): key is OwnerOnlyField {
  return (OWNER_ONLY_FIELDS as readonly string[]).includes(key);
}

function isMemberBrandField(key: string): boolean {
  return (MEMBER_BRAND_FIELDS as readonly string[]).includes(key);
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
  const permissions = organization ? orgPermissionFlags(organization as Record<string, unknown>) : null;
  return NextResponse.json({
    organization,
    viewer: {
      id: user.id ?? '',
      email: (session.user as { email?: string }).email ?? '',
      role: user.role ?? 'member',
    },
    permissions,
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

  const role = user.role ?? 'member';
  const flags = orgPermissionFlags(org);
  const canEditBrand = memberCanEditOrgBrand(role, flags);

  if (!canEditBrand) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const isOwner = role === 'owner';
  const isAdmin = isOrgAdminRole(role);

  const $set: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (isOwnerOnlyField(key)) {
      if (!isOwner) continue;
      const value = body[key];
      if (typeof value === 'boolean') {
        $set[key] = value;
      }
      continue;
    }

    if (!isPatchableField(key)) continue;

    if (role === 'member' && !isMemberBrandField(key)) {
      continue;
    }

    const value = body[key];
    if (value !== undefined) {
      $set[key] = value;
    }
  }

  if (role === 'member' && Object.keys($set).some((k) => isOwnerOnlyField(k))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isAdmin && !isOwner && Object.keys($set).length === 0) {
    return NextResponse.json({ error: 'No allowed fields to update' }, { status: 400 });
  }

  await unsetLegacyOrgAddressFields(user.organizationId);

  let logoUrlWarning: string | undefined;
  if ($set.logoUrl !== undefined) {
    const nextLogoUrl = String($set.logoUrl ?? '').trim();
    if (nextLogoUrl && !isAllowedOrgLogoUrl(nextLogoUrl, user.organizationId)) {
      delete $set.logoUrl;
      logoUrlWarning = orgLogoUrlValidationMessage();
    } else {
      $set.logoUrl = nextLogoUrl;
    }
  }

  if ($set.logoShape !== undefined) {
    const shape = String($set.logoShape);
    if (shape !== 'rectangle' && shape !== 'circle') {
      return NextResponse.json({ error: 'logoShape must be rectangle or circle' }, { status: 400 });
    }
    $set.logoShape = shape;
  }

  const analyticsEnabled = hasAnalytics({
    plan: String(org.plan ?? ''),
    subscriptionStatus: String(org.subscriptionStatus ?? ''),
  });
  if (!analyticsEnabled) {
    if ($set.signatureClickTrackingEnabled !== undefined) {
      $set.signatureClickTrackingEnabled = false;
    }
    if ($set.signatureOpenTrackingEnabled !== undefined) {
      $set.signatureOpenTrackingEnabled = false;
    }
  }

  if (Object.keys($set).length === 0) {
    const current = await OrganizationModel.findById(user.organizationId).lean();
    return NextResponse.json({
      organization: current,
      permissions: current ? orgPermissionFlags(current as Record<string, unknown>) : null,
      ...(logoUrlWarning ? { logoUrlWarning } : {}),
    });
  }

  const updated = await OrganizationModel.findByIdAndUpdate(user.organizationId, { $set }, { new: true }).lean();
  if (!updated) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  return NextResponse.json({
    organization: updated,
    permissions: orgPermissionFlags(updated as Record<string, unknown>),
    ...(logoUrlWarning ? { logoUrlWarning } : {}),
  });
}
