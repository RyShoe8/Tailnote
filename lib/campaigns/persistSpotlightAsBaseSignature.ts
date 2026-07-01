import type { ContentBlockData } from 'emailsignature-engine';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { UserSignatureProfileModel } from '@/models/UserSignatureProfile';
import { findOrgTemplateWithAvailablePreset } from '@/lib/templates/validateOrgTemplate';
import { syncOwnerEmployeeFromProfile } from '@/lib/employees/syncOwnerEmployeeFromProfile';
import { sanitizeContentBlocksForSave } from '@/lib/quotes/contentBlockSchema';
import { loadSubmitterSnapshotSources } from '@/lib/campaigns/loadSubmitterSnapshotSources';

export type SpotlightSignaturePersistInput = {
  userId: string;
  companyName: string;
  website: string;
  logoUrl: string;
  logoHeightPx?: number;
  logoShape?: 'rectangle' | 'circle';
  logoLink?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  animation?: { enabled?: boolean; gifUrl?: string };
  socialProfiles?: Record<string, string>;
  brandOrder?: string[];
  hiddenFields?: string[];
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  officePhone?: string;
  mobilePhone?: string;
  avatarUrl?: string;
  detailOrder?: string[];
  contactDisplayOrder?: string[];
  profileHiddenFields?: string[];
  templateId?: string;
  contentBlocks?: ContentBlockData[];
};

function profileIsBlank(
  profile: { templateId?: unknown; contentBlocks?: unknown[] } | null | undefined,
): boolean {
  if (!profile) return true;
  const hasTemplate =
    profile.templateId != null && String(profile.templateId).length > 0;
  const blocks = profile.contentBlocks;
  const hasBlocks = Array.isArray(blocks) && blocks.length > 0;
  return !hasTemplate && !hasBlocks;
}

/** Seed org + signature profile from spotlight apply when user has not customized yet. */
export async function persistSpotlightAsBaseSignature(
  input: SpotlightSignaturePersistInput,
): Promise<void> {
  await connectMongoose();

  const sources = await loadSubmitterSnapshotSources(input.userId);
  const organizationId = sources.org?._id;
  if (!organizationId) return;

  const existingProfile = await UserSignatureProfileModel.findOne({
    userId: input.userId,
  }).lean();

  if (!profileIsBlank(existingProfile as { templateId?: unknown; contentBlocks?: unknown[] } | null)) {
    return;
  }

  const socialLinks = input.socialProfiles ?? {};
  const orgUpdate: Record<string, unknown> = {
    name: input.companyName,
    companyName: input.companyName,
    website: input.website,
    logoUrl: input.logoUrl,
    logoLink: input.logoLink ?? '',
    primaryColor: input.primaryColor ?? '',
    secondaryColor: input.secondaryColor ?? '',
    fontFamily: input.fontFamily ?? 'Arial',
    address: input.address ?? '',
    city: input.city ?? '',
    state: input.state ?? '',
    zip: input.zip ?? '',
    socialLinks,
    brandOrder: input.brandOrder ?? [],
    hiddenFields: input.hiddenFields ?? [],
  };

  if (typeof input.logoHeightPx === 'number' && input.logoHeightPx > 0) {
    orgUpdate.logoHeightPx = input.logoHeightPx;
  }
  if (input.logoShape) {
    orgUpdate.logoShape = input.logoShape;
  }
  if (input.animation) {
    orgUpdate.animation = input.animation;
  }

  await OrganizationModel.findByIdAndUpdate(organizationId, { $set: orgUpdate });

  let templateObjectId: import('mongoose').Types.ObjectId | undefined;
  if (input.templateId) {
    const tmpl = await findOrgTemplateWithAvailablePreset(
      input.templateId,
      String(organizationId),
    );
    if (tmpl) {
      templateObjectId = tmpl._id;
    }
  }

  const contentBlocks = sanitizeContentBlocksForSave(input.contentBlocks ?? []);

  await UserSignatureProfileModel.findOneAndUpdate(
    { userId: input.userId },
    {
      userId: input.userId,
      firstName: input.firstName,
      lastName: input.lastName,
      title: input.title,
      email: input.email,
      officePhone: input.officePhone ?? '',
      mobilePhone: input.mobilePhone ?? '',
      avatarUrl: input.avatarUrl ?? '',
      hiddenFields: input.profileHiddenFields ?? [],
      detailOrder: input.detailOrder ?? [],
      contactDisplayOrder: input.contactDisplayOrder ?? [],
      contentBlocks,
      ...(templateObjectId ? { templateId: templateObjectId } : {}),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const authEmail = sources.authUser?.email ?? input.email;
  if (authEmail) {
    await syncOwnerEmployeeFromProfile(
      organizationId,
      {
        id: input.userId,
        email: authEmail,
        name: sources.authUser?.name ?? null,
      },
      {
        firstName: input.firstName,
        lastName: input.lastName,
        title: input.title,
        email: input.email,
        officePhone: input.officePhone,
        mobilePhone: input.mobilePhone,
        contentBlocks,
        templateId: templateObjectId ? String(templateObjectId) : input.templateId,
      },
    );
  }
}
