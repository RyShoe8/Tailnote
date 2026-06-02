import { NextResponse } from 'next/server';
import { hasAnalytics } from 'billing-engine';
import { DASHBOARD_UPGRADE_HREF } from '@/lib/billing/upgradeLinks';

export function analyticsRequiredResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'Upgrade required for analytics',
      code: 'analytics_upgrade_required',
      upgradeUrl: DASHBOARD_UPGRADE_HREF,
    },
    { status: 402 }
  );
}

export function assertOrganizationHasAnalytics(
  org: { plan?: string | null; subscriptionStatus?: string | null } | null
): NextResponse | null {
  if (!hasAnalytics(org)) {
    return analyticsRequiredResponse();
  }
  return null;
}

export function requireAnalytics(
  org: { plan?: string | null; subscriptionStatus?: string | null } | null
): NextResponse | null {
  return assertOrganizationHasAnalytics(org);
}
