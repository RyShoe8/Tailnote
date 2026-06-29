import mongoose from 'mongoose';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import {
  buildTrustCenterPillars,
  type TrustCenterBimiState,
  type TrustCenterPillarId,
} from '@/lib/brandTrust/buildTrustCenterPillars';
import { domainFromOrgWebsite } from '@/lib/brandTrust/domainFromOrg';
import { domainToSlug } from '@/lib/email-health/domain';
import { loadScanBySlug } from '@/lib/email-health/loadScan';
import { connectMongoose } from '@/lib/mongoose';
import type { OrganizationDoc } from '@/models/Organization';
import { OrgBrandTrustScanModel } from '@/models/OrgBrandTrustScan';

export type TrustCenterPillarStatus = 'confirmed' | 'needs_action';

export type TrustCenterDomainRow = {
  domain: string;
  domainSlug: string;
  scannedAt: string;
  pillars: Record<TrustCenterPillarId, TrustCenterPillarStatus>;
};

const LIST_LIMIT = 25;

function bimiStateForDomain(
  domain: string,
  org: OrganizationDoc,
  canUseBimiLogoHosting: boolean,
): TrustCenterBimiState {
  return {
    canUseBimiLogoHosting,
    bimiLogoUrl: String(org.bimiLogoUrl ?? ''),
    bimiSuggestedRecord: String(org.bimiSuggestedRecord ?? ''),
  };
}

function pillarStatusesFromScan(
  scan: Awaited<ReturnType<typeof loadScanBySlug>>,
  bimi: TrustCenterBimiState,
): Record<TrustCenterPillarId, TrustCenterPillarStatus> | null {
  if (!scan) return null;
  const pillars = buildTrustCenterPillars(scan, bimi);
  return {
    deliverability: pillars.find((p) => p.id === 'deliverability')!.status,
    security: pillars.find((p) => p.id === 'security')!.status,
    branding: pillars.find((p) => p.id === 'branding')!.status,
  };
}

export async function registerOrgBrandTrustScan(
  organizationId: string,
  domain: string,
  scannedAt: Date = new Date(),
): Promise<void> {
  await connectMongoose();
  const normalized = domain.trim().toLowerCase();
  await OrgBrandTrustScanModel.findOneAndUpdate(
    { organizationId: new mongoose.Types.ObjectId(organizationId), domain: normalized },
    {
      $set: {
        domainSlug: domainToSlug(normalized),
        lastScannedAt: scannedAt,
      },
    },
    { upsert: true },
  );
}

export async function listOrgBrandTrustDomainRows(org: OrganizationDoc): Promise<TrustCenterDomainRow[]> {
  await connectMongoose();
  const entitlements = getBillingEntitlements(org);
  const orgId = org._id;

  const orgDomain = domainFromOrgWebsite(org.website);
  if (orgDomain) {
    const slug = domainToSlug(orgDomain);
    const existingScan = await loadScanBySlug(slug);
    if (existingScan) {
      await registerOrgBrandTrustScan(String(orgId), orgDomain, new Date(existingScan.scannedAt));
    }
  }

  const rows = await OrgBrandTrustScanModel.find({ organizationId: orgId })
    .sort({ lastScannedAt: -1 })
    .limit(LIST_LIMIT)
    .lean();

  const results: TrustCenterDomainRow[] = [];

  for (const row of rows) {
    const scan = await loadScanBySlug(row.domainSlug);
    const bimi = bimiStateForDomain(row.domain, org, entitlements.canUseBimiLogoHosting);
    const pillars = pillarStatusesFromScan(scan, bimi);
    if (!scan || !pillars) {
      await OrgBrandTrustScanModel.deleteOne({ _id: row._id });
      continue;
    }
    results.push({
      domain: scan.domain,
      domainSlug: scan.domainSlug,
      scannedAt: scan.scannedAt.toISOString(),
      pillars,
    });
  }

  return results;
}
