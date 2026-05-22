import { NextResponse } from 'next/server';
import type { OrganizationDoc } from '@/models/Organization';
import { isOrganizationPaid } from '@/lib/billing/subscriptionAccess';

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
