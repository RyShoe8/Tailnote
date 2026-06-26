import { notFound } from 'next/navigation';
import { BrandTrustHubClient } from '@/components/brand-trust/BrandTrustHubClient';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import { domainFromOrgWebsite } from '@/lib/brandTrust/domainFromOrg';
import { getDashboardOrg, getDashboardSession } from '@/lib/dashboard/getDashboardContext';
import { loadScanBySlug } from '@/lib/email-health/loadScan';
import { connectMongoose } from '@/lib/mongoose';

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export default async function DashboardBrandTrustResultPage({ params }: Props) {
  const { user } = await getDashboardSession();
  await connectMongoose();
  const org = await getDashboardOrg(user.organizationId!);
  const { slug } = await params;
  const scan = await loadScanBySlug(slug);
  if (!scan) notFound();

  const orgDomain = domainFromOrgWebsite(org.website);
  const entitlements = getBillingEntitlements(org);

  return (
    <BrandTrustHubClient
      orgDomain={orgDomain ?? scan.domain}
      initialScan={scan}
      canUseBimiLogoHosting={entitlements.canUseBimiLogoHosting}
      bimiLogoUrl={String(org.bimiLogoUrl ?? '')}
      bimiSuggestedRecord={String(org.bimiSuggestedRecord ?? '')}
    />
  );
}
