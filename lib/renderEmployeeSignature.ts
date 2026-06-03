import { renderSignature, type RenderSignatureInput, type ContentBlockData } from 'emailsignature-engine';
import { buildRenderInput, type OrgBrandInput, type EmployeeProfileInput } from '@/lib/email/toRenderInput';
import { engineTemplateFromStoredConfig, type TemplatePresetId } from '@/lib/email/templatePresets';
import type { OrganizationDoc } from '@/models/Organization';
import type { EmployeeDoc } from '@/models/Employee';
import type { SignatureTemplateDoc } from '@/models/SignatureTemplate';
import { shouldIncludeSignatureAnimation } from '@/lib/billing/entitlements';
import { getSignatureAssetOrigin } from '@/lib/siteOrigin';
import {
  appendSignatureClickTrackingIfEnabled,
  appendSignatureOpenTrackingPixelIfEnabled,
} from '@/lib/signatureTrackingHtml';
import { vcardDownloadUrl } from '@/lib/vcard/vcardDownloadUrl';
import { appendSignatureAttributionIfNeeded } from '@/lib/signatureAttribution';

/** Default UTM parameters for Tailnote signatures. */
const DEFAULT_UTM = { source: 'Tailnote', medium: 'Email', campaign: 'Footer' };

export function orgToBrandInput(org: OrganizationDoc, contentBlocks?: ContentBlockData[]): OrgBrandInput {
  const sl = org.socialLinks as
    | { linkedin?: string; facebook?: string; instagram?: string; reddit?: string; discord?: string; bluesky?: string; youtube?: string }
    | undefined;
  return {
    companyName: (org.companyName || org.name || '').trim(),
    website: (org.website || '').trim(),
    logoUrl: (org.logoUrl || '').trim(),
    logoShape: org.logoShape === 'circle' ? 'circle' : 'rectangle',
    logoLink: (org.logoLink || '').trim(),
    primaryColor: org.primaryColor || '#0a0a0a',
    secondaryColor: (org.secondaryColor as string | undefined)?.trim() || '',
    fontFamily: org.fontFamily || 'Arial',
    socialLinks: {
      linkedin: sl?.linkedin,
      facebook: sl?.facebook,
      instagram: sl?.instagram,
      reddit: sl?.reddit,
      discord: sl?.discord,
      bluesky: sl?.bluesky,
      youtube: sl?.youtube,
    },
    address: org.address ?? undefined,
    city: org.city ?? undefined,
    state: org.state ?? undefined,
    zip: org.zip ?? undefined,
    animation: org.animation as OrgBrandInput['animation'],
    contentBlocks,
    ...(typeof org.logoHeightPx === 'number' && org.logoHeightPx > 0
      ? { logoHeightPx: org.logoHeightPx }
      : {}),
  };
}

export function employeeToProfile(emp: EmployeeDoc): EmployeeProfileInput {
  return {
    firstName: emp.firstName,
    lastName: emp.lastName,
    title: emp.title || '',
    email: emp.email,
    officePhone: emp.phone?.trim() || undefined,
  };
}

/**
 * Extract content blocks from an employee document into engine-compatible data.
 */
export function employeeContentBlocks(emp: EmployeeDoc): ContentBlockData[] {
  const blocks = (emp as unknown as { contentBlocks?: unknown[] }).contentBlocks;
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((b: unknown): b is ContentBlockData =>
      typeof b === 'object' && b !== null && 'type' in b
    )
    .slice(0, 2);
}

/** Employee LinkedIn overrides org default when set (dashboard + server renders stay aligned). */
export function mergeEmployeeSocialIntoOrgBrand(
  org: OrganizationDoc,
  employee: Pick<EmployeeDoc, 'linkedin'>,
  contentBlocks?: ContentBlockData[]
): OrgBrandInput {
  const base = orgToBrandInput(org, contentBlocks);
  const li = employee.linkedin?.trim();
  return {
    ...base,
    socialLinks: {
      ...base.socialLinks,
      linkedin: li || base.socialLinks.linkedin?.trim() || undefined,
    },
  };
}

export function renderSignatureForEmployee(
  org: OrganizationDoc,
  emp: EmployeeDoc,
  tmpl: SignatureTemplateDoc,
  options?: { publicSiteOrigin?: string; contentBlocks?: ContentBlockData[] }
): string {
  const presetId = tmpl.presetId as TemplatePresetId;
  const includeAnimation = shouldIncludeSignatureAnimation(org, tmpl);
  const template = engineTemplateFromStoredConfig({
    templateId: tmpl._id.toString(),
    name: tmpl.name,
    presetId,
    includeAnimationSlot: includeAnimation,
  });
  const publicSiteOrigin = options?.publicSiteOrigin?.trim() || getSignatureAssetOrigin();
  const contentBlocks = options?.contentBlocks ?? employeeContentBlocks(emp);
  const utmEnabled = (org as unknown as { utmEnabled?: boolean }).utmEnabled !== false;
  const vcardUrl = emp.previewToken
    ? vcardDownloadUrl(publicSiteOrigin, String(emp.previewToken))
    : undefined;
  const renderInput: RenderSignatureInput = {
    ...buildRenderInput({
      orgBrand: mergeEmployeeSocialIntoOrgBrand(org, emp, contentBlocks),
      employee: employeeToProfile(emp),
      template,
      publicSiteOrigin,
      utm: utmEnabled ? DEFAULT_UTM : false,
      vcardDownloadUrl: vcardUrl,
    }),
    publicSiteOrigin,
  };
  let html = renderSignature(renderInput);
  html = appendSignatureClickTrackingIfEnabled({
    html,
    org,
    organizationId: String(org._id),
    employeeId: String(emp._id),
    input: renderInput,
    baseUrl: publicSiteOrigin,
  });
  html = appendSignatureAttributionIfNeeded({
    html,
    org,
  });
  html = appendSignatureOpenTrackingPixelIfEnabled({
    html,
    org,
    organizationId: String(org._id),
    employeeId: String(emp._id),
    baseUrl: publicSiteOrigin,
  });
  return html;
}

/** Server render with org permission-aware promotional blocks. */
export async function renderSignatureForEmployeeResolved(
  org: OrganizationDoc,
  emp: EmployeeDoc,
  tmpl: SignatureTemplateDoc,
  options?: { publicSiteOrigin?: string }
): Promise<string> {
  const { resolveEmployeeContentBlocks } = await import('@/lib/org/resolveEmployeeContentBlocks');
  const contentBlocks = await resolveEmployeeContentBlocks(org, emp);
  return renderSignatureForEmployee(org, emp, tmpl, { ...options, contentBlocks });
}
