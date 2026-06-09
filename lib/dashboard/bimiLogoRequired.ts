import { NextResponse } from 'next/server';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import { DASHBOARD_UPGRADE_HREF } from '@/lib/billing/upgradeLinks';
import type { OrganizationDoc } from '@/models/Organization';

export function bimiLogoHostingRequiredResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'Upgrade required for BIMI logo hosting',
      code: 'bimi_logo_upgrade_required',
      upgradeUrl: DASHBOARD_UPGRADE_HREF,
    },
    { status: 402 }
  );
}

export function assertOrganizationHasBimiLogoHosting(
  org: Pick<OrganizationDoc, 'plan' | 'subscriptionStatus'> | null | undefined
): NextResponse | null {
  if (!getBillingEntitlements(org).canUseBimiLogoHosting) {
    return bimiLogoHostingRequiredResponse();
  }
  return null;
}
