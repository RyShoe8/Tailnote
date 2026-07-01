import { arrayMove } from '@dnd-kit/sortable';
import { formFieldToPreviewField, getLayoutEditorFields, type SignatureLayout } from 'emailsignature-engine';
import type { SignatureProfile } from 'emailsignature-engine';
import {
  deriveContactOrderFromDetailOrder,
  syncDetailOrderFromContact,
  defaultContactOrder,
} from '@/lib/signature/fieldOrder';

export function defaultContactDisplayOrder(reorderableFields: readonly string[]): string[] {
  return defaultContactOrder(reorderableFields);
}

export function reorderContactDisplayOrder(
  currentOrder: string[],
  rawFieldId: string,
  insertAfterField: string | null,
): string[] {
  const fieldId = formFieldToPreviewField(rawFieldId);
  const order = [...currentOrder];
  const curIdx = order.indexOf(fieldId);
  if (curIdx !== -1) order.splice(curIdx, 1);

  if (insertAfterField === null) {
    order.unshift(fieldId);
  } else {
    const afterIdx = order.indexOf(insertAfterField);
    if (afterIdx !== -1) {
      order.splice(afterIdx + 1, 0, fieldId);
    } else {
      order.push(fieldId);
    }
  }
  return order;
}

export function reorderDetailAndContact(
  profile: SignatureProfile,
  activeId: string,
  overId: string,
  layout: SignatureLayout,
): SignatureProfile {
  const { editableFormFields, reorderablePreviewFields } = getLayoutEditorFields(layout);
  const currentOrder = profile.detailOrder?.length
    ? profile.detailOrder.filter((id) => editableFormFields.includes(id))
    : [...editableFormFields];
  const activeItems = [...new Set([...currentOrder, ...editableFormFields])].filter((id) =>
    editableFormFields.includes(id),
  );

  const oldIndex = activeItems.indexOf(activeId);
  const newIndex = activeItems.indexOf(overId);
  if (oldIndex === -1 || newIndex === -1) {
    return profile;
  }

  const activePreview = formFieldToPreviewField(activeId);
  const overPreview = formFieldToPreviewField(overId);
  if (
    !reorderablePreviewFields.includes(activePreview) ||
    !reorderablePreviewFields.includes(overPreview)
  ) {
    return profile;
  }

  const newDetailOrder = arrayMove(activeItems, oldIndex, newIndex);
  const baseContact = profile.contactDisplayOrder?.length
    ? [...profile.contactDisplayOrder]
    : defaultContactDisplayOrder(reorderablePreviewFields);

  const newContactDisplayOrder = deriveContactOrderFromDetailOrder(
    newDetailOrder,
    reorderablePreviewFields,
    baseContact,
  );

  return {
    ...profile,
    detailOrder: newDetailOrder,
    contactDisplayOrder: newContactDisplayOrder,
  };
}

export function reorderBrandOrder(
  currentOrder: string[],
  activeId: string,
  overId: string,
  allowedIds: readonly string[],
): string[] {
  const items = currentOrder.length ? [...currentOrder] : [...allowedIds];
  const activeItems = [...new Set([...items, ...allowedIds])].filter((id) => allowedIds.includes(id));
  const oldIndex = activeItems.indexOf(activeId);
  const newIndex = activeItems.indexOf(overId);
  if (oldIndex === -1 || newIndex === -1) return currentOrder;
  return arrayMove(activeItems, oldIndex, newIndex);
}

export type PendingPreviewDrop = {
  insertAfterField: string | null;
};

/** Prefer explicit zone hit on drag end; fall back to last hovered preview zone. */
export function resolvePreviewDropTarget(
  overId: string | null,
  pending: PendingPreviewDrop | null,
  overZoneData?: { insertAfterField?: string | null } | null,
): PendingPreviewDrop | null {
  if (overId?.startsWith('zone-') && overZoneData) {
    return { insertAfterField: overZoneData.insertAfterField ?? null };
  }
  return pending;
}

export function profileAfterContactReorder(
  profile: SignatureProfile,
  newContactDisplayOrder: string[],
  reorderableFields: readonly string[],
): SignatureProfile {
  return {
    ...profile,
    contactDisplayOrder: newContactDisplayOrder,
    detailOrder: syncDetailOrderFromContact(profile.detailOrder, newContactDisplayOrder, reorderableFields),
  };
}
