import { BrandTrustHubClient } from '@/components/brand-trust/BrandTrustHubClient';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import { domainFromOrgWebsite } from '@/lib/brandTrust/domainFromOrg';
import { domainToSlug } from '@/lib/email-health/domain';
import { loadOrCreateScanBySlug } from '@/lib/email-health/loadScan';
import { getDashboardOrg, getDashboardSession } from '@/lib/dashboard/getDashboardContext';
import { connectMongoose } from '@/lib/mongoose';
import { persistBimiScanResult } from '@/lib/email-health/persistBimi';

export const dynamic = 'force-dynamic';

export default async function BrandTrustPage() {
  const { user } = await getDashboardSession();
  await connectMongoose();
  const org = await getDashboardOrg(user.organizationId!);

  const orgDomain = domainFromOrgWebsite(org.website);
  const entitlements = getBillingEntitlements(org);

  let scan = null;
  if (orgDomain) {
    const loaded = await loadOrCreateScanBySlug(domainToSlug(orgDomain));
    if (loaded) {
      scan = loaded;
      if (loaded.bimiDetail) {
        await persistBimiScanResult({
          domain: orgDomain,
          result: loaded.bimiDetail,
          organizationId: org._id,
        });
      }
    }
  }

  return (
    <BrandTrustHubClient
      orgDomain={orgDomain}
      scan={scan}
      canUseBimiLogoHosting={entitlements.canUseBimiLogoHosting}
      bimiLogoUrl={String(org.bimiLogoUrl ?? '')}
      bimiSuggestedRecord={String(org.bimiSuggestedRecord ?? '')}
    />
  );
}
