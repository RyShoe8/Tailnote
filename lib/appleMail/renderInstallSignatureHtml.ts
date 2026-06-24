import { randomUUID } from 'crypto';
import { renderSignature, type RenderSignatureInput } from 'emailsignature-engine';
import { buildRenderInput, type EmployeeProfileInput } from '@/lib/email/toRenderInput';
import { engineTemplateFromStoredConfig, type TemplatePresetId } from '@/lib/email/templatePresets';
import { shouldIncludeSignatureAnimation } from '@/lib/billing/entitlements';
import {
  employeeToProfile,
  mergeEmployeeSocialIntoOrgBrand,
  orgToBrandInput,
  renderSignatureForEmployeeResolved,
} from '@/lib/renderEmployeeSignature';
import { resolveEmployeeContentBlocks } from '@/lib/org/resolveEmployeeContentBlocks';
import { appendSignatureClickTrackingIfEnabled } from '@/lib/signatureTrackingHtml';
import { appendSignatureAttributionIfNeeded } from '@/lib/signatureAttribution';
import { vcardDownloadUrl } from '@/lib/vcard/vcardDownloadUrl';
import { sanitizeForAppleMail } from '@/lib/appleMail/sanitizeForAppleMail';
import { generateAppleMailInstallScript } from '@/lib/appleMail/generateInstallScript';
import type { OrganizationDoc } from '@/models/Organization';
import type { EmployeeDoc } from '@/models/Employee';
import type { SignatureTemplateDoc } from '@/models/SignatureTemplate';
import type { UserSignatureProfileDoc } from '@/models/UserSignatureProfile';

export type AppleMailInstallerBundle = {
  filename: string;
  content: string;
  signatureUniqueId: string;
  signatureName: string;
};

function signatureDisplayName(profile: EmployeeProfileInput): string {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  return name ? `Tailnote — ${name}` : 'Tailnote Signature';
}

function finalizeInstallHtml(
  html: string,
  org: OrganizationDoc,
  profile: EmployeeProfileInput,
  publicSiteOrigin: string
): AppleMailInstallerBundle {
  const sanitized = sanitizeForAppleMail(html);
  const signatureUniqueId = randomUUID().toLowerCase();
  const signatureName = signatureDisplayName(profile);
  const content = generateAppleMailInstallScript({
    signatureUniqueId,
    signatureName,
    html: sanitized,
  });
  return {
    filename: 'tailnote-install.command',
    content,
    signatureUniqueId,
    signatureName,
  };
}

export async function renderAppleMailInstallerForEmployee(args: {
  org: OrganizationDoc;
  employee: EmployeeDoc;
  template: SignatureTemplateDoc;
  publicSiteOrigin: string;
}): Promise<AppleMailInstallerBundle> {
  let html = await renderSignatureForEmployeeResolved(args.org, args.employee, args.template, {
    publicSiteOrigin: args.publicSiteOrigin,
  });
  html = stripOpenTrackingPixel(html);
  return finalizeInstallHtml(html, args.org, employeeToProfile(args.employee), args.publicSiteOrigin);
}

export async function renderAppleMailInstallerForMe(args: {
  org: OrganizationDoc;
  template: SignatureTemplateDoc;
  profile: UserSignatureProfileDoc;
  employeeDoc?: EmployeeDoc | null;
  publicSiteOrigin: string;
}): Promise<AppleMailInstallerBundle> {
  const presetId = args.template.presetId as TemplatePresetId;
  const includeAnimation = shouldIncludeSignatureAnimation(args.org, args.template);
  const template = engineTemplateFromStoredConfig({
    templateId: args.template._id.toString(),
    name: args.template.name,
    presetId,
    includeAnimationSlot: includeAnimation,
  });

  let orgBrand = orgToBrandInput(args.org);
  const employee: EmployeeProfileInput = {
    firstName: args.profile.firstName,
    lastName: args.profile.lastName,
    title: args.profile.title || '',
    email: args.profile.email,
    officePhone: args.profile.officePhone ?? '',
    mobilePhone: args.profile.mobilePhone ?? '',
  };

  if (args.employeeDoc) {
    const blocks = await resolveEmployeeContentBlocks(args.org, args.employeeDoc);
    orgBrand = mergeEmployeeSocialIntoOrgBrand(args.org, args.employeeDoc, blocks);
  } else if ((args.profile as { contentBlocks?: unknown[] }).contentBlocks) {
    orgBrand.contentBlocks = (args.profile as { contentBlocks?: unknown[] })
      .contentBlocks as never;
  }

  const previewToken = args.employeeDoc?.previewToken?.trim();
  const vcardUrl = previewToken ? vcardDownloadUrl(args.publicSiteOrigin, previewToken) : undefined;
  const employeeIdForTracking = args.employeeDoc ? String(args.employeeDoc._id) : undefined;

  const renderInput: RenderSignatureInput = {
    ...buildRenderInput({
      orgBrand,
      employee,
      template,
      publicSiteOrigin: args.publicSiteOrigin,
      vcardDownloadUrl: vcardUrl,
    }),
    publicSiteOrigin: args.publicSiteOrigin,
  };

  let html = renderSignature(renderInput);
  html = appendSignatureClickTrackingIfEnabled({
    html,
    org: args.org,
    organizationId: String(args.org._id),
    employeeId: employeeIdForTracking,
    input: renderInput,
    baseUrl: args.publicSiteOrigin,
  });
  html = appendSignatureAttributionIfNeeded({ html, org: args.org });
  html = stripOpenTrackingPixel(html);

  return finalizeInstallHtml(html, args.org, employee, args.publicSiteOrigin);
}

function stripOpenTrackingPixel(html: string): string {
  return html.replace(
    /<img[^>]*src=["'][^"']*\/api\/track\/signature\/open[^"']*["'][^>]*>/gi,
    ''
  );
}
