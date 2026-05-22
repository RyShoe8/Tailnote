import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel, type EmployeeDoc } from '@/models/Employee';
import { OrganizationModel } from '@/models/Organization';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { isOrganizationPaid } from '@/lib/billing/subscriptionAccess';
import { renderSignatureForEmployeeResolved } from '@/lib/renderEmployeeSignature';
import { getRequestSiteOrigin, getSignatureAssetOrigin } from '@/lib/siteOrigin';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function PublicSignaturePage({ params }: { params: Promise<{ previewToken: string }> }) {
  const { previewToken } = await params;
  await connectMongoose();
  const employee = await EmployeeModel.findOne({ previewToken }).lean<EmployeeDoc | null>();
  if (!employee) notFound();
  const org = await OrganizationModel.findById(employee.organizationId).lean();
  const tmpl = await SignatureTemplateModel.findOne({
    _id: employee.templateId,
    organizationId: employee.organizationId,
  }).lean();
  if (!org || !tmpl) notFound();
  if (!isOrganizationPaid(org as { subscriptionStatus?: string })) notFound();

  const h = await headers();
  const origin = getRequestSiteOrigin(h) ?? getSignatureAssetOrigin();
  const html = await renderSignatureForEmployeeResolved(org as never, employee as never, tmpl as never, {
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
