import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel, type EmployeeDoc } from '@/models/Employee';
import { OrganizationModel } from '@/models/Organization';
import { SignatureTemplateModel, type SignatureTemplateDoc } from '@/models/SignatureTemplate';
import { isTemplatePresetId, TEMPLATE_PRESET_META } from '@/lib/email/templatePresets';
import { renderSignatureForEmployeeResolved } from '@/lib/renderEmployeeSignature';
import { getRequestSiteOrigin, getSignatureAssetOrigin } from '@/lib/siteOrigin';
import { SITE_NAME } from '@/lib/seo/site';

type PageProps = {
  params: Promise<{ previewToken: string }>;
  searchParams: Promise<{ preset?: string }>;
};

function presetDisplayName(presetId: string): string {
  const meta = TEMPLATE_PRESET_META.find((p) => p.id === presetId);
  return meta?.name ?? presetId;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { preset } = await searchParams;
  if (preset && isTemplatePresetId(preset)) {
    return {
      title: `${presetDisplayName(preset)} · ${SITE_NAME} preview`,
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `${SITE_NAME} preview`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicSignaturePage({ params, searchParams }: PageProps) {
  const { previewToken } = await params;
  const { preset: presetParam } = await searchParams;
  await connectMongoose();
  const employee = await EmployeeModel.findOne({ previewToken }).lean<EmployeeDoc | null>();
  if (!employee) notFound();
  const org = await OrganizationModel.findById(employee.organizationId).lean();
  const tmpl = await SignatureTemplateModel.findOne({
    _id: employee.templateId,
    organizationId: employee.organizationId,
  }).lean<SignatureTemplateDoc | null>();
  if (!org || !tmpl) notFound();

  const presetOverride =
    presetParam && isTemplatePresetId(presetParam) ? presetParam : undefined;
  const renderTmpl = (
    presetOverride ? { ...tmpl, presetId: presetOverride } : tmpl
  ) as SignatureTemplateDoc;

  const h = await headers();
  const origin = getRequestSiteOrigin(h) ?? getSignatureAssetOrigin();
  const html = await renderSignatureForEmployeeResolved(org as never, employee as never, renderTmpl as never, {
    publicSiteOrigin: origin,
  });

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl overflow-x-auto rounded-lg border bg-white p-4 shadow-sm sm:p-6">
        <div className="signature-email-preview" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
