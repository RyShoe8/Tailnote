import type { SignatureLayout } from './types';

export type LayoutReorderRules = {
  layout: SignatureLayout;
  /** Canonical preview field ids allowed to reorder in this layout. */
  reorderableFields: readonly string[];
  /** Regions that cannot be moved via drag (avatar, social strip, promo blocks, etc.). */
  fixedFields: readonly string[];
};

const MP_FIELDS = ['logo', 'name', 'title', 'email', 'website'] as const;
const DEFAULT_MAIN_FIELDS = ['name', 'title', 'email', 'officePhone', 'mobilePhone', 'website'] as const;
const CORPORATE_FIELDS = ['name', 'title', 'companyName', 'email', 'officePhone', 'mobilePhone', 'website'] as const;
const STACKED_FIELDS = ['logo', 'name', 'title', 'email', 'officePhone', 'mobilePhone', 'website', 'address'] as const;
const CREATOR_FIELDS = ['name', 'title', 'email', 'officePhone', 'mobilePhone', 'website'] as const;
const PORTFOLIO_FIELDS = ['name', 'title', 'email', 'officePhone', 'mobilePhone', 'website'] as const;

const RULES: Record<SignatureLayout, LayoutReorderRules> = {
  modern_professional: {
    layout: 'modern_professional',
    reorderableFields: MP_FIELDS,
    fixedFields: ['avatar', 'socialLinks', 'contentBlocks'],
  },
  default: {
    layout: 'default',
    reorderableFields: DEFAULT_MAIN_FIELDS,
    fixedFields: ['logo', 'address', 'socialLinks', 'contentBlocks'],
  },
  standard: {
    layout: 'standard',
    reorderableFields: CORPORATE_FIELDS,
    fixedFields: ['logo', 'address', 'socialLinks', 'contentBlocks'],
  },
  corporate: {
    layout: 'corporate',
    reorderableFields: CORPORATE_FIELDS,
    fixedFields: ['logo', 'socialLinks', 'contentBlocks'],
  },
  professional: {
    layout: 'professional',
    reorderableFields: CORPORATE_FIELDS,
    fixedFields: ['logo', 'socialLinks', 'contentBlocks'],
  },
  stacked: {
    layout: 'stacked',
    reorderableFields: STACKED_FIELDS,
    fixedFields: ['socialLinks', 'contentBlocks'],
  },
  creator: {
    layout: 'creator',
    reorderableFields: CREATOR_FIELDS,
    fixedFields: ['socialLinks', 'contentBlocks'],
  },
  executive_minimalist: {
    layout: 'executive_minimalist',
    reorderableFields: CREATOR_FIELDS,
    fixedFields: ['logo', 'socialLinks', 'contentBlocks'],
  },
  portfolio: {
    layout: 'portfolio',
    reorderableFields: PORTFOLIO_FIELDS,
    fixedFields: ['logo', 'socialLinks', 'contentBlocks'],
  },
  ecard: {
    layout: 'ecard',
    reorderableFields: PORTFOLIO_FIELDS,
    fixedFields: ['logo', 'socialLinks', 'contentBlocks'],
  },
};

export function getLayoutReorderRules(layout: SignatureLayout): LayoutReorderRules {
  return RULES[layout] ?? RULES.standard;
}

export function resolveFieldOrder(
  rules: LayoutReorderRules,
  contactDisplayOrder?: string[],
): string[] {
  const allowed = new Set(rules.reorderableFields);
  const base = [...rules.reorderableFields];
  if (!contactDisplayOrder?.length) {
    return base;
  }
  const ordered: string[] = [];
  for (const field of contactDisplayOrder) {
    if (allowed.has(field) && !ordered.includes(field)) {
      ordered.push(field);
    }
  }
  for (const field of base) {
    if (!ordered.includes(field)) {
      ordered.push(field);
    }
  }
  return ordered;
}

export function isFieldReorderable(
  rules: LayoutReorderRules,
  previewFieldId: string,
): boolean {
  return rules.reorderableFields.includes(previewFieldId);
}

/** Map form/sidebar field ids to canonical preview field ids. */
export function formFieldToPreviewField(formFieldId: string): string {
  if (formFieldId === 'firstName' || formFieldId === 'lastName') return 'name';
  if (formFieldId === 'avatarUrl') return 'avatar';
  if (formFieldId === 'logoUrl') return 'logo';
  return formFieldId;
}

export function previewFieldToFormFields(previewFieldId: string): string[] {
  if (previewFieldId === 'name') return ['firstName', 'lastName'];
  if (previewFieldId === 'avatar') return ['avatarUrl'];
  if (previewFieldId === 'logo') return ['logoUrl'];
  return [previewFieldId];
}
