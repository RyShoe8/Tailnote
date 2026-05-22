import type { OrganizationDoc } from '@/models/Organization';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import { isOrganizationPaid } from '@/lib/billing/subscriptionAccess';

export function canUsePaidFeatures(org: OrganizationDoc | null): boolean {
  return isOrganizationPaid(org);
}

export function isProPlan(org: OrganizationDoc | null): boolean {
  return getBillingEntitlements(org).isPro;
}
