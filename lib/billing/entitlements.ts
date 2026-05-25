import type { OrganizationDoc } from '@/models/Organization';
import { isOrganizationPaid } from '@/lib/billing/subscriptionAccess';

/** Matches the four built-in presets (minimal, stacked, corporate, professional). */
const MAX_TEMPLATES_BASIC = 4;

export type BillingEntitlements = {
  isPro: boolean;
  maxTemplates: number;
  canUseTemplateAnimationSlot: boolean;
};

const FULL_MAX_TEMPLATES = 10;

export function getBillingEntitlements(
  org: Pick<OrganizationDoc, 'plan' | 'subscriptionStatus'> | null | undefined
): BillingEntitlements {
  const paid = isOrganizationPaid(org);
  if (!paid) {
    return {
      isPro: false,
      maxTemplates: MAX_TEMPLATES_BASIC,
      canUseTemplateAnimationSlot: false,
    };
  }
  return {
    isPro: true,
    maxTemplates: FULL_MAX_TEMPLATES,
    canUseTemplateAnimationSlot: true,
  };
}

export function shouldIncludeSignatureAnimation(
  org: Pick<OrganizationDoc, 'plan' | 'subscriptionStatus'> | null | undefined,
  template: { includeAnimationSlot: boolean }
): boolean {
  return getBillingEntitlements(org).canUseTemplateAnimationSlot && Boolean(template.includeAnimationSlot);
}
