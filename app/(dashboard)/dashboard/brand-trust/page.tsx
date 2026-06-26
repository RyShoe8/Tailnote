import { BrandTrustHubClient } from '@/components/brand-trust/BrandTrustHubClient';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import { domainFromOrgWebsite } from '@/lib/brandTrust/domainFromOrg';
import { listOrgBrandTrustDomainRows } from '@/lib/brandTrust/orgBrandTrustScans';
import { domainToSlug } from '@/lib/email-health/domain';
import { loadScanBySlug } from '@/lib/email-health/loadScan';
import { getDashboardOrg, getDashboardSession } from '@/lib/dashboard/getDashboardContext';
import { connectMongoose } from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

export default async function BrandTrustPage() {
  const { user } = await getDashboardSession();
  await connectMongoose();
  const org = await getDashboardOrg(user.organizationId!);

  const orgDomain = domainFromOrgWebsite(org.website);
  const entitlements = getBillingEntitlements(org);

  let initialScan = null;
  const initialDomains = await listOrgBrandTrustDomainRows(org);
  if (orgDomain) {
    initialScan = await loadScanBySlug(domainToSlug(orgDomain));
  } else if (initialDomains.length > 0) {
    initialScan = await loadScanBySlug(initialDomains[0]!.domainSlug);
  }

  return (
    <BrandTrustHubClient
      orgDomain={orgDomain}
      initialScan={initialScan}
      initialDomains={initialDomains}
      canUseBimiLogoHosting={entitlements.canUseBimiLogoHosting}
      bimiLogoUrl={String(org.bimiLogoUrl ?? '')}
      bimiSuggestedRecord={String(org.bimiSuggestedRecord ?? '')}
    />
  );
}
