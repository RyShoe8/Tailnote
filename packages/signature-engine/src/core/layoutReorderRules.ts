import type { SignatureLayout } from './types';

export type LayoutReorderRules = {
  layout: SignatureLayout;
  /** Canonical preview field ids allowed to reorder in this layout. */
  reorderableFields: readonly string[];
  /** Regions that cannot be moved via drag (avatar, social strip, promo blocks, etc.). */
  fixedFields: readonly string[];
};

const MP_FIELDS = ['logo', 'name', 'title', 'email', 'website'] as const;
const DEFAULT_MAIN_FIELDS = ['name', 'title', 'companyName', 'email', 'officePhone', 'mobilePhone', 'website'] as const;
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

const BRAND_ORDER_FIELDS = ['companyName', 'website'] as const;

/** Reorder companyName vs website relative to each other within a resolved field list. */
export function applyBrandFieldOrder(order: string[], brandOrder?: string[]): string[] {
  if (!brandOrder?.length) return order;

  const present = BRAND_ORDER_FIELDS.filter((field) => order.includes(field));
  if (present.length < 2) return order;

  const brandSequence: string[] = [];
  for (const field of brandOrder) {
    if (present.includes(field as (typeof BRAND_ORDER_FIELDS)[number]) && !brandSequence.includes(field)) {
      brandSequence.push(field);
    }
  }
  for (const field of present) {
    if (!brandSequence.includes(field)) brandSequence.push(field);
  }

  const indices = present.map((field) => order.indexOf(field)).sort((a, b) => a - b);
  const next = [...order];
  brandSequence.forEach((field, index) => {
    next[indices[index]!] = field;
  });
  return next;
}

export function resolveFieldOrder(
  rules: LayoutReorderRules,
  contactDisplayOrder?: string[],
  brandOrder?: string[],
): string[] {
  const allowed = new Set(rules.reorderableFields);
  const base = [...rules.reorderableFields];
  let ordered: string[];
  if (!contactDisplayOrder?.length) {
    ordered = base;
  } else {
    ordered = [];
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
  }
  return applyBrandFieldOrder(ordered, brandOrder);
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

const BRAND_PREVIEW_FIELDS = new Set(['companyName', 'website', 'address', 'logo']);
const NON_SIDEBAR_PREVIEW_FIELDS = new Set(['socialLinks', 'contentBlocks', ...BRAND_PREVIEW_FIELDS]);

export type LayoutEditorFields = LayoutReorderRules & {
  reorderablePreviewFields: readonly string[];
  fixedPreviewFields: readonly string[];
  editableFormFields: readonly string[];
  reorderableFormFields: readonly string[];
  brandFieldsInLayout: readonly string[];
};

/** Map template layout to sidebar inputs and drag targets. */
export function getLayoutEditorFields(layout: SignatureLayout): LayoutEditorFields {
  const rules = getLayoutReorderRules(layout);
  const sidebarPreviewFields = [
    ...rules.reorderableFields,
    ...rules.fixedFields,
  ].filter((field) => !NON_SIDEBAR_PREVIEW_FIELDS.has(field));

  const editableFormFields: string[] = [];
  for (const previewField of sidebarPreviewFields) {
    for (const formField of previewFieldToFormFields(previewField)) {
      if (!editableFormFields.includes(formField)) {
        editableFormFields.push(formField);
      }
    }
  }

  const reorderableFormFields: string[] = [];
  for (const previewField of rules.reorderableFields) {
    if (NON_SIDEBAR_PREVIEW_FIELDS.has(previewField)) continue;
    for (const formField of previewFieldToFormFields(previewField)) {
      if (editableFormFields.includes(formField) && !reorderableFormFields.includes(formField)) {
        reorderableFormFields.push(formField);
      }
    }
  }

  const brandFieldsInLayout = rules.reorderableFields.filter(
    (field) => field === 'companyName' || field === 'website',
  );

  return {
    ...rules,
    reorderablePreviewFields: rules.reorderableFields,
    fixedPreviewFields: rules.fixedFields,
    editableFormFields,
    reorderableFormFields,
    brandFieldsInLayout,
  };
}
