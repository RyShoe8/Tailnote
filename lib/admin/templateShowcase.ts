import { connectMongoose } from '@/lib/mongoose';
import { isTemplatePresetId, type TemplatePresetId } from '@/lib/email/templatePresets';
import { isOrganizationPaid } from '@/lib/billing/subscriptionAccess';
import { getSiteUrl } from '@/lib/seo/site';
import { EmployeeModel, type EmployeeDoc } from '@/models/Employee';
import { OrganizationModel } from '@/models/Organization';

/** Platform admin showcase: real signature data for sharing template demos. */
export const TEMPLATE_SHOWCASE_EMAIL = 'ryanschumacher@themediashop.co';

export type TemplateShowcaseEmployee = {
  previewToken: string;
  employeeEmail: string;
};

export function buildTemplateShowcaseUrl(
  origin: string,
  previewToken: string,
  presetId: TemplatePresetId
): string {
  const base = origin.replace(/\/+$/, '');
  const token = previewToken.trim();
  return `${base}/p/${encodeURIComponent(token)}?preset=${encodeURIComponent(presetId)}`;
}

export function getTemplateShowcaseSiteOrigin(): string {
  return getSiteUrl();
}

/** Resolves showcase employee with paid org and preview token (same gates as /p/ preview). */
export async function getTemplateShowcaseEmployee(): Promise<TemplateShowcaseEmployee | null> {
  await connectMongoose();
  const email = TEMPLATE_SHOWCASE_EMAIL.trim().toLowerCase();
  const employee = await EmployeeModel.findOne({ email }).lean<EmployeeDoc | null>();
  if (!employee?.previewToken?.trim()) return null;

  const org = await OrganizationModel.findById(employee.organizationId).lean();
  if (!org || !isOrganizationPaid(org as { subscriptionStatus?: string })) return null;

  return {
    previewToken: String(employee.previewToken).trim(),
    employeeEmail: String(employee.email ?? email),
  };
}

export async function buildTemplateShowcaseUrlsForPresets(
  presetIds: string[]
): Promise<Map<string, string | null>> {
  const showcase = await getTemplateShowcaseEmployee();
  const origin = getTemplateShowcaseSiteOrigin();
  const out = new Map<string, string | null>();

  if (!showcase) {
    for (const id of presetIds) out.set(id, null);
    return out;
  }

  for (const presetId of presetIds) {
    if (!isTemplatePresetId(presetId)) {
      out.set(presetId, null);
      continue;
    }
    out.set(presetId, buildTemplateShowcaseUrl(origin, showcase.previewToken, presetId));
  }
  return out;
}
