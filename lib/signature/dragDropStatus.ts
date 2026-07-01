import {
  formFieldToPreviewField,
  isFieldReorderable,
  getLayoutReorderRules,
  type SignatureLayout,
} from 'emailsignature-engine';

/** Human-readable labels for form and preview field ids. */
export const FIELD_LABELS: Record<string, string> = {
  companyName: 'Company',
  email: 'Email',
  website: 'Website',
  officePhone: 'Office phone',
  mobilePhone: 'Mobile phone',
  name: 'Name',
  title: 'Title',
  logo: 'Logo',
  avatar: 'Photo',
  socialLinks: 'Social links',
  address: 'Address',
  avatarUrl: 'Profile picture',
  firstName: 'First name',
  lastName: 'Last name',
  logoUrl: 'Logo',
};

export type DragOverTarget = 'none' | 'preview-zone' | 'sidebar-field' | 'brand-field';

export type SignatureDragStatus = {
  draggedFieldId: string | null;
  overTarget: DragOverTarget;
  zoneInsertAfter: string | null;
};

export type DragDropStatusVariant = 'info' | 'active' | 'warning' | 'muted';

export type DragDropStatusResult = {
  message: string;
  variant: DragDropStatusVariant;
};

export function fieldLabel(fieldId: string | null): string {
  if (!fieldId) return 'Field';
  const previewId = formFieldToPreviewField(fieldId);
  return FIELD_LABELS[fieldId] ?? FIELD_LABELS[previewId] ?? fieldId;
}

export function zonePlacementLabel(insertAfterField: string | null): string {
  if (insertAfterField === null) return 'at the top';
  return `below ${FIELD_LABELS[insertAfterField] ?? insertAfterField}`;
}

const DETAIL_FIELD_IDS = new Set([
  'avatarUrl',
  'firstName',
  'lastName',
  'title',
  'email',
  'officePhone',
  'mobilePhone',
]);

const BRAND_FIELD_IDS = new Set(['companyName', 'website']);

export function classifyDragOverTarget(overId: string | null): {
  overTarget: DragOverTarget;
  zoneInsertAfter: string | null;
} {
  if (!overId) {
    return { overTarget: 'none', zoneInsertAfter: null };
  }
  if (overId.startsWith('zone-')) {
    return { overTarget: 'preview-zone', zoneInsertAfter: null };
  }
  if (overId.startsWith('sig-order:')) {
    return { overTarget: 'sidebar-field', zoneInsertAfter: null };
  }
  if (BRAND_FIELD_IDS.has(overId)) {
    return { overTarget: 'brand-field', zoneInsertAfter: null };
  }
  if (DETAIL_FIELD_IDS.has(overId)) {
    return { overTarget: 'sidebar-field', zoneInsertAfter: null };
  }
  return { overTarget: 'none', zoneInsertAfter: null };
}

export type GetDragDropStatusInput = {
  dragStatus: SignatureDragStatus;
  layout: SignatureLayout;
  reorderableFields: readonly string[];
  isLgUp: boolean;
  dropZoneCount: number;
};

export function getDragDropStatus(input: GetDragDropStatusInput): DragDropStatusResult | null {
  const { dragStatus, layout, reorderableFields, isLgUp, dropZoneCount } = input;
  const { draggedFieldId, overTarget, zoneInsertAfter } = dragStatus;

  if (!draggedFieldId) return null;

  const label = fieldLabel(draggedFieldId);
  const previewId = formFieldToPreviewField(draggedFieldId);
  const rules = getLayoutReorderRules(layout);
  const isReorderable = isFieldReorderable(rules, previewId);

  if (!isReorderable) {
    return {
      message: `${label} is fixed in this layout.`,
      variant: 'warning',
    };
  }

  if (!isLgUp) {
    return {
      message: 'Use Signature field order below the preview to reorder.',
      variant: 'muted',
    };
  }

  if (overTarget === 'preview-zone') {
    return {
      message: `Release to place ${label} ${zonePlacementLabel(zoneInsertAfter)}.`,
      variant: 'active',
    };
  }

  if (overTarget === 'sidebar-field' || overTarget === 'brand-field') {
    return {
      message: `Release to reorder ${label} in the field list.`,
      variant: 'active',
    };
  }

  if (dropZoneCount === 0) {
    return {
      message: 'Fill in name and email so preview slots appear.',
      variant: 'muted',
    };
  }

  return {
    message: `Drag in the list below, or drop ${label} into a highlighted slot in the preview.`,
    variant: 'info',
  };
}
