import type { OrganizationDoc } from '@/models/Organization';
import { isOrganizationPaid } from '@/lib/billing/subscriptionAccess';
import { MAX_TEMPLATES_BASIC } from '@/lib/stripe/config';

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

/** True when rendered HTML should include the GIF animation slot for this org + template. */
export function shouldIncludeSignatureAnimation(
  org: Pick<OrganizationDoc, 'plan' | 'subscriptionStatus'> | null | undefined,
  template: { includeAnimationSlot: boolean }
): boolean {
  return getBillingEntitlements(org).canUseTemplateAnimationSlot && Boolean(template.includeAnimationSlot);
}
