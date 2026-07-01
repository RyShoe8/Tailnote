import {
  renderSignature,
  type ContentBlockData,
  type SignatureBrand,
  type SignatureProfile,
  type SignatureTemplate,
} from 'emailsignature-engine';
import { engineTemplateFromStoredConfig, TEMPLATE_PRESET_META, type TemplatePresetId } from '@/lib/email/templatePresets';
import { shouldIncludeSignatureAnimation } from '@/lib/billing/entitlements';
import { hydrateQuoteContentBlocks } from '@/lib/quotes/hydrateQuoteContentBlocks';
import { stripSignaturePreviewLinks } from '@/lib/marketing/stripSignaturePreviewLinks';
import { appendSignatureAttributionIfNeeded } from '@/lib/signatureAttribution';
import { getSignatureAssetOrigin } from '@/lib/siteOrigin';
import { loadSubmitterSnapshotSources } from '@/lib/campaigns/loadSubmitterSnapshotSources';
import type { SubmissionSnapshotInput } from '@/lib/campaigns/resolveSubmissionSnapshot';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import type { OrganizationDoc } from '@/models/Organization';
import { connectMongoose } from '@/lib/mongoose';

export type RenderSubmissionSignatureInput = SubmissionSnapshotInput & {
  templateId?: string;
  userId?: string;
  companyName?: string;
  website?: string;
  logoUrl?: string;
};

type SocialLinks = SignatureBrand['socialLinks'];

function socialProfilesToLinks(
  socialProfiles?: Record<string, string>,
): SocialLinks {
  const sl = socialProfiles ?? {};
  return {
    linkedin: typeof sl.linkedin === 'string' ? sl.linkedin.trim() : undefined,
    facebook: typeof sl.facebook === 'string' ? sl.facebook.trim() : undefined,
    instagram: typeof sl.instagram === 'string' ? sl.instagram.trim() : undefined,
    reddit: typeof sl.reddit === 'string' ? sl.reddit.trim() : undefined,
    discord: typeof sl.discord === 'string' ? sl.discord.trim() : undefined,
    bluesky: typeof sl.bluesky === 'string' ? sl.bluesky.trim() : undefined,
    youtube: typeof sl.youtube === 'string' ? sl.youtube.trim() : undefined,
  };
}

/** Build content blocks from snapshot — mirrors SpotlightEditorWorkspace load fallback. */
export function contentBlocksFromSubmission(
  submission: Pick<RenderSubmissionSignatureInput, 'contentBlocks' | 'content'>,
): ContentBlockData[] {
  const blocks = submission.contentBlocks;
  if (Array.isArray(blocks) && blocks.length > 0) {
    return blocks as ContentBlockData[];
  }
  const quote =
    submission.content &&
    typeof submission.content === 'object' &&
    'quote' in submission.content &&
    typeof (submission.content as { quote?: string }).quote === 'string'
      ? (submission.content as { quote: string }).quote.trim()
      : '';
  if (quote) {
    return [{ type: 'quote', quoteSource: 'custom', quoteText: quote, enabled: true }];
  }
  return [];
}

export function submissionBrandFromSnapshot(
  submission: RenderSubmissionSignatureInput,
): SignatureBrand {
  const hiddenFields = submission.hiddenFields ?? [];
  const socialLinks = socialProfilesToLinks(submission.socialProfiles);
  const brand: SignatureBrand = {
    companyName: (submission.companyName ?? '').trim(),
    website: (submission.website ?? '').trim(),
    logoUrl: (submission.logoUrl ?? '').trim(),
    ...(typeof submission.logoHeightPx === 'number' && submission.logoHeightPx > 0
      ? { logoHeightPx: submission.logoHeightPx }
      : {}),
    logoShape: submission.logoShape === 'circle' ? 'circle' : 'rectangle',
    logoLink: (submission.logoLink ?? '').trim(),
    primaryColor: (submission.primaryColor ?? '#0a0a0a').trim(),
    secondaryColor: (submission.secondaryColor ?? '').trim(),
    fontFamily: (submission.fontFamily ?? 'Arial').trim(),
    socialLinks,
    address: submission.address?.trim(),
    city: submission.city?.trim(),
    state: submission.state?.trim(),
    zip: submission.zip?.trim(),
    animation: {
      enabled: Boolean(submission.animation?.enabled),
      gifUrl: submission.animation?.gifUrl?.trim() ?? '',
    },
    brandOrder: submission.brandOrder?.length ? [...submission.brandOrder] : undefined,
    hiddenFields: [...hiddenFields],
    spotlightEnabled: false,
  };

  if (hiddenFields.length) {
    for (const field of hiddenFields) {
      if (field === 'socialLinks') {
        brand.socialLinks = {};
      } else if (field in brand) {
        (brand as Record<string, unknown>)[field] = field === 'animation' ? undefined : '';
      }
    }
  }

  return brand;
}

export function submissionProfileFromSnapshot(
  submission: RenderSubmissionSignatureInput,
): SignatureProfile {
  const hiddenFields = submission.hiddenFields ?? [];
  const profile: SignatureProfile = {
    firstName: (submission.firstName ?? '').trim(),
    lastName: (submission.lastName ?? '').trim(),
    title: (submission.title ?? '').trim(),
    email: (submission.email ?? '').trim(),
    officePhone: submission.officePhone?.trim(),
    mobilePhone: submission.mobilePhone?.trim(),
    avatarUrl: submission.avatarUrl?.trim(),
    detailOrder: submission.detailOrder?.length ? [...submission.detailOrder] : undefined,
    contactDisplayOrder: submission.contactDisplayOrder?.length
      ? [...submission.contactDisplayOrder]
      : undefined,
    hiddenFields: [...hiddenFields],
  };

  if (hiddenFields.length) {
    for (const field of hiddenFields) {
      if (field in profile) {
        (profile as Record<string, unknown>)[field] = '';
      }
    }
  }

  return profile;
}

async function resolveEngineTemplate(
  templateId: string | undefined,
  org: Pick<OrganizationDoc, 'plan' | 'subscriptionStatus'> | null,
): Promise<SignatureTemplate> {
  await connectMongoose();

  if (templateId) {
    const tmpl = await SignatureTemplateModel.findById(templateId).lean<{
      _id: { toString(): string };
      name?: string;
      presetId?: string;
      includeAnimationSlot?: boolean;
    }>();
    if (tmpl?.presetId) {
      const presetId = tmpl.presetId as TemplatePresetId;
      return engineTemplateFromStoredConfig({
        templateId: tmpl._id.toString(),
        name: tmpl.name ?? 'Submission',
        presetId,
        includeAnimationSlot: shouldIncludeSignatureAnimation(org, {
          includeAnimationSlot: Boolean(tmpl.includeAnimationSlot),
        }),
      });
    }
  }

  return engineTemplateFromStoredConfig({
    templateId: templateId ?? 'spotlight-fallback',
    name: 'Modern Professional',
    presetId: 'modern_professional',
    includeAnimationSlot: false,
  });
}

export async function renderSubmissionSignature(
  submission: RenderSubmissionSignatureInput,
): Promise<string> {
  const org = submission.userId
    ? ((await loadSubmitterSnapshotSources(submission.userId)).org as Pick<
        OrganizationDoc,
        'plan' | 'subscriptionStatus'
      > | null)
    : null;

  const engineTemplate = await resolveEngineTemplate(submission.templateId, org);
  const rawBlocks = contentBlocksFromSubmission(submission);
  const contentBlocks = await hydrateQuoteContentBlocks(rawBlocks);

  const profile = submissionProfileFromSnapshot(submission);
  const brand = submissionBrandFromSnapshot(submission);
  brand.contentBlocks = contentBlocks;

  const publicSiteOrigin = getSignatureAssetOrigin();
  const isFreeTier = !org?.plan || org.plan === 'free';

  let html = renderSignature({
    profile,
    brand,
    template: engineTemplate,
    publicSiteOrigin,
    utm: false,
    isFreeTier,
  });

  html = appendSignatureAttributionIfNeeded({
    html,
    org: org ? { plan: org.plan, subscriptionStatus: org.subscriptionStatus } : null,
  });

  return stripSignaturePreviewLinks(html);
}

export type SubmissionTemplateInfo = {
  templateName: string;
  presetLabel: string;
  presetId: string | null;
};

export async function resolveSubmissionTemplateInfo(
  templateId?: string,
): Promise<SubmissionTemplateInfo> {
  await connectMongoose();

  if (!templateId?.trim()) {
    return {
      templateName: 'Modern Professional',
      presetLabel: 'Modern Professional',
      presetId: 'modern_professional',
    };
  }

  const tmpl = await SignatureTemplateModel.findById(templateId).lean<{
    name?: string;
    presetId?: string;
  }>();

  if (!tmpl?.presetId) {
    return {
      templateName: 'Unknown template',
      presetLabel: '—',
      presetId: null,
    };
  }

  const presetMeta = TEMPLATE_PRESET_META.find((m) => m.id === tmpl.presetId);

  return {
    templateName: tmpl.name?.trim() || presetMeta?.name || tmpl.presetId,
    presetLabel: presetMeta?.name ?? tmpl.presetId,
    presetId: tmpl.presetId,
  };
}
