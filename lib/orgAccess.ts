import type { OrganizationDoc } from '@/models/Organization';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import { isPaidPlan } from 'billing-engine';

export function canUsePaidFeatures(org: OrganizationDoc | null): boolean {
  return Boolean(org);
}

export function isProPlan(org: OrganizationDoc | null): boolean {
  return isPaidPlan(org) && getBillingEntitlements(org).isPro;
}
