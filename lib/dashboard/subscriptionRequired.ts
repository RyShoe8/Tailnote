import { NextResponse } from 'next/server';
import type { OrganizationDoc } from '@/models/Organization';
import { hasDashboardAccess, isOrganizationPaid } from '@/lib/billing/subscriptionAccess';

export function subscriptionRequiredResponse(): NextResponse {
  return NextResponse.json({ error: 'Subscription required' }, { status: 402 });
}

export function assertOrganizationSubscriptionPaid(
  org: Pick<OrganizationDoc, 'subscriptionStatus'> | null
): NextResponse | null {
  if (!isOrganizationPaid(org)) {
    return subscriptionRequiredResponse();
  }
  return null;
}

/** Prefer this for product APIs: allows freemium as well as paid. */
export function assertHasDashboardAccess(
  org: Pick<OrganizationDoc, 'plan' | 'subscriptionStatus'> | null | undefined,
): NextResponse | null {
  if (!hasDashboardAccess(org)) {
    return subscriptionRequiredResponse();
  }
  return null;
}
