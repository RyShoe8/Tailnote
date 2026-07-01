import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import { domainFromOrgWebsite } from '@/lib/brandTrust/domainFromOrg';
import { listOrgBrandTrustDomainRows } from '@/lib/brandTrust/orgBrandTrustScans';
import { loadScanBySlug } from '@/lib/email-health/loadScan';
import { domainToSlug } from '@/lib/email-health/domain';
import { OrganizationModel, type OrganizationDoc } from '@/models/Organization';
import { BimiScanResultModel } from '@/models/BimiScanResult';

export const dynamic = 'force-dynamic';

type SessionUser = { organizationId?: string };

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ orgDomain: null, scan: null, entitlements: { canUseBimiLogoHosting: false } });
  }

  await connectMongoose();
  const org = (await OrganizationModel.findById(user.organizationId).lean()) as OrganizationDoc | null;
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const orgDomain = domainFromOrgWebsite(org.website);
  const entitlements = getBillingEntitlements(org);

  let scan = null;
  if (orgDomain) {
    const slug = domainToSlug(orgDomain);
    const serialized = await loadScanBySlug(slug);
    if (serialized) scan = serialized;
  }

  const bimiRow = orgDomain
    ? await BimiScanResultModel.findOne({
        organizationId: org._id,
        domain: orgDomain.toLowerCase(),
      }).lean()
    : null;

  const domains = await listOrgBrandTrustDomainRows(org);

  return NextResponse.json({
    orgDomain,
    scan,
    domains,
    bimiLogoUrl: org.bimiLogoUrl ?? '',
    bimiSuggestedRecord: org.bimiSuggestedRecord ?? '',
    bimiLogoUploadedAt: org.bimiLogoUploadedAt ?? null,
    bimiScan: bimiRow,
    entitlements: {
      canUseBimiLogoHosting: entitlements.canUseBimiLogoHosting,
    },
  });
}
