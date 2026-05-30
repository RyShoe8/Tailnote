import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { renderSignature, type RenderSignatureInput } from 'emailsignature-engine';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { UserSignatureProfileModel } from '@/models/UserSignatureProfile';
import { buildRenderInput, type EmployeeProfileInput } from '@/lib/email/toRenderInput';
import { EmployeeModel } from '@/models/Employee';
import {
  employeeToProfile,
  mergeEmployeeSocialIntoOrgBrand,
  orgToBrandInput,
} from '@/lib/renderEmployeeSignature';
import { resolveEmployeeContentBlocks } from '@/lib/org/resolveEmployeeContentBlocks';
import { engineTemplateFromStoredConfig, type TemplatePresetId } from '@/lib/email/templatePresets';
import { shouldIncludeSignatureAnimation } from '@/lib/billing/entitlements';
import { assertOrganizationSubscriptionPaid } from '@/lib/dashboard/subscriptionRequired';
import {
  appendSignatureClickTrackingIfEnabled,
  appendSignatureOpenTrackingPixelIfEnabled,
} from '@/lib/signatureTrackingHtml';
import {
  isAllowedOrgLogoUrl,
  orgLogoUrlValidationMessage,
} from '@/lib/org/validateOrgLogoUrl';
import { vcardDownloadUrl } from '@/lib/vcard/vcardDownloadUrl';

export const dynamic = 'force-dynamic';

const BrandOverrideSchema = z
  .object({
    fontFamily: z.string().max(200).optional(),
    primaryColor: z.string().max(40).optional(),
    secondaryColor: z.string().max(40).optional(),
    logoUrl: z.string().max(2000).optional(),
    logoShape: z.enum(['rectangle', 'circle']).optional(),
    logoLink: z.string().max(2000).optional(),
    website: z.string().max(2000).optional(),
    companyName: z.string().max(200).optional(),
    socialLinks: z
      .object({
        linkedin: z.string().max(2000).optional(),
        facebook: z.string().max(2000).optional(),
        instagram: z.string().max(2000).optional(),
        reddit: z.string().max(2000).optional(),
        discord: z.string().max(2000).optional(),
      })
      .optional(),
    address: z.string().max(300).optional(),
    city: z.string().max(120).optional(),
    state: z.string().max(120).optional(),
    zip: z.string().max(40).optional(),
    animation: z
      .object({
        enabled: z.boolean().optional(),
        gifUrl: z.string().max(2000).optional(),
      })
      .optional(),
  })
  .partial();

const BodySchema = z.object({
  templateId: z.string().min(1),
  /** When set, tracking tokens include this employee; LinkedIn merge uses `linkedin` body or saved employee. */
  employeeId: z.string().min(1).optional(),
  linkedin: z.string().trim().max(500).optional(),
  profile: z
    .object({
      firstName: z.string().trim().max(120),
      lastName: z.string().trim().max(120),
      title: z.string().trim().max(200),
      email: z.string().trim().email().max(320),
      officePhone: z.string().trim().max(80).optional(),
      mobilePhone: z.string().trim().max(80).optional(),
      contentBlocks: z.array(z.any()).optional(),
    })
    .optional(),
  /** Unsaved brand edits from the dashboard editor; merged over the org doc for the preview render only. */
  brandOverride: BrandOverrideSchema.optional(),
});

type SessionUser = { id?: string; organizationId?: string; role?: string };

export async function POST(request: Request) {
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
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(' ') }, { status: 400 });
  }

  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  const subErr = assertOrganizationSubscriptionPaid(org);
  if (subErr) return subErr;

  const tmpl = await SignatureTemplateModel.findOne({
    _id: parsed.data.templateId,
    organizationId: org._id,
  });
  if (!tmpl) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  let employeeIdForTracking: string | undefined;
  let previewTokenForVcard: string | undefined;
  let employee: EmployeeProfileInput;
  let orgBrand = orgToBrandInput(org as never);

  if (parsed.data.employeeId) {
    const empDoc = await EmployeeModel.findOne({
      _id: parsed.data.employeeId,
      organizationId: org._id,
    });
    if (!empDoc) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    employeeIdForTracking = String(empDoc._id);
    previewTokenForVcard = String(empDoc.previewToken ?? '').trim() || undefined;
    const li = parsed.data.linkedin ?? (typeof empDoc.linkedin === 'string' ? empDoc.linkedin : '');
    const resolvedBlocks = await resolveEmployeeContentBlocks(org as never, empDoc as never);
    if (parsed.data.profile) {
      const p = parsed.data.profile;
      employee = {
        firstName: p.firstName,
        lastName: p.lastName,
        title: p.title,
        email: p.email,
        officePhone: p.officePhone ?? '',
        mobilePhone: p.mobilePhone ?? '',
      };
      orgBrand = mergeEmployeeSocialIntoOrgBrand(org as never, { linkedin: li }, p.contentBlocks ?? resolvedBlocks);
    } else {
      employee = employeeToProfile(empDoc);
      orgBrand = mergeEmployeeSocialIntoOrgBrand(org as never, { linkedin: li }, resolvedBlocks);
    }
  } else if (parsed.data.profile) {
    const p = parsed.data.profile;
    employee = {
      firstName: p.firstName,
      lastName: p.lastName,
      title: p.title,
      email: p.email,
      officePhone: p.officePhone ?? '',
      mobilePhone: p.mobilePhone ?? '',
    };
    if (p.contentBlocks) {
      orgBrand.contentBlocks = p.contentBlocks;
    }
  } else {
    const row = await UserSignatureProfileModel.findOne({ userId: user.id }).lean();
    if (!row) {
      return NextResponse.json({ error: 'No saved profile; pass profile in request body' }, { status: 400 });
    }
    employee = {
      firstName: row.firstName,
      lastName: row.lastName,
      title: row.title,
      email: row.email,
      officePhone: row.officePhone ?? '',
      mobilePhone: row.mobilePhone ?? '',
    };
    const selfEmp = await EmployeeModel.findOne({
      organizationId: org._id,
      userId: user.id,
    }).lean();
    const blocks = selfEmp
      ? await resolveEmployeeContentBlocks(org as never, selfEmp as never)
      : ((row as { contentBlocks?: unknown[] }).contentBlocks as import('emailsignature-engine').ContentBlockData[] | undefined);
    if (blocks?.length) {
      orgBrand = mergeEmployeeSocialIntoOrgBrand(org as never, { linkedin: '' }, blocks);
    } else if ((row as { contentBlocks?: unknown[] }).contentBlocks) {
      orgBrand.contentBlocks = (row as { contentBlocks?: unknown[] }).contentBlocks as never;
    }
  }

  const override = parsed.data.brandOverride;
  if (override) {
    orgBrand = {
      ...orgBrand,
      ...(override.fontFamily !== undefined ? { fontFamily: override.fontFamily } : {}),
      ...(override.primaryColor !== undefined ? { primaryColor: override.primaryColor } : {}),
      ...(override.secondaryColor !== undefined ? { secondaryColor: override.secondaryColor } : {}),
      ...(override.logoUrl !== undefined ? { logoUrl: override.logoUrl } : {}),
      ...(override.logoShape !== undefined ? { logoShape: override.logoShape } : {}),
      ...(override.logoLink !== undefined ? { logoLink: override.logoLink } : {}),
      ...(override.website !== undefined ? { website: override.website } : {}),
      ...(override.companyName !== undefined ? { companyName: override.companyName } : {}),
      ...(override.address !== undefined ? { address: override.address } : {}),
      ...(override.city !== undefined ? { city: override.city } : {}),
      ...(override.state !== undefined ? { state: override.state } : {}),
      ...(override.zip !== undefined ? { zip: override.zip } : {}),
      socialLinks: { ...orgBrand.socialLinks, ...(override.socialLinks ?? {}) },
      ...(override.animation !== undefined
        ? {
            animation: {
              enabled: Boolean(override.animation.enabled ?? orgBrand.animation?.enabled ?? false),
              gifUrl: override.animation.gifUrl ?? orgBrand.animation?.gifUrl,
            },
          }
        : {}),
    };
  }

  const mergedLogoUrl = orgBrand.logoUrl.trim();
  if (mergedLogoUrl && !isAllowedOrgLogoUrl(mergedLogoUrl, user.organizationId)) {
    const savedLogo = String(org.logoUrl ?? '').trim();
    if (mergedLogoUrl !== savedLogo) {
      return NextResponse.json({ error: orgLogoUrlValidationMessage() }, { status: 400 });
    }
  }

  const presetId = tmpl.presetId as TemplatePresetId;
  const includeAnimation = shouldIncludeSignatureAnimation(org as never, tmpl as never);
  const template = engineTemplateFromStoredConfig({
    templateId: tmpl._id.toString(),
    name: tmpl.name,
    presetId,
    includeAnimationSlot: includeAnimation,
  });

  const publicSiteOrigin = new URL(request.url).origin;

  if (!previewTokenForVcard) {
    const selfEmp = await EmployeeModel.findOne({
      organizationId: org._id,
      userId: user.id,
    })
      .select('_id previewToken')
      .lean<{ _id: mongoose.Types.ObjectId; previewToken?: string }>();
    if (selfEmp?._id) {
      employeeIdForTracking = employeeIdForTracking ?? String(selfEmp._id);
      previewTokenForVcard = selfEmp.previewToken?.trim() || undefined;
    }
  }

  const vcardUrl = previewTokenForVcard
    ? vcardDownloadUrl(publicSiteOrigin, previewTokenForVcard)
    : undefined;

  const renderInput: RenderSignatureInput = {
    ...buildRenderInput({
      orgBrand,
      employee,
      template,
      publicSiteOrigin,
      vcardDownloadUrl: vcardUrl,
    }),
    publicSiteOrigin,
  };

  let html = renderSignature(renderInput);
  html = appendSignatureClickTrackingIfEnabled({
    html,
    org: org as never,
    organizationId: String(org._id),
    employeeId: employeeIdForTracking,
    input: renderInput,
    baseUrl: publicSiteOrigin,
  });
  html = appendSignatureOpenTrackingPixelIfEnabled({
    html,
    org: org as never,
    organizationId: String(org._id),
    employeeId: employeeIdForTracking,
    baseUrl: publicSiteOrigin,
  });

  return NextResponse.json({ html });
}
