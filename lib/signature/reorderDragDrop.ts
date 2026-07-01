import { arrayMove } from '@dnd-kit/sortable';
import { formFieldToPreviewField } from 'emailsignature-engine';
import type { SignatureProfile } from 'emailsignature-engine';

const DEFAULT_DETAIL_ORDER = [
  'avatarUrl',
  'firstName',
  'lastName',
  'title',
  'email',
  'officePhone',
  'mobilePhone',
];

export function defaultContactDisplayOrder(reorderableFields: readonly string[]): string[] {
  return [...reorderableFields];
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
  reorderableFields: readonly string[],
): SignatureProfile {
  const defaultOrder = DEFAULT_DETAIL_ORDER;
  const currentOrder = profile.detailOrder?.length ? profile.detailOrder : defaultOrder;
  const activeItems = [...new Set([...currentOrder, ...defaultOrder])].filter((id) =>
    defaultOrder.includes(id),
  );

  const oldIndex = activeItems.indexOf(activeId);
  const newIndex = activeItems.indexOf(overId);
  if (oldIndex === -1 || newIndex === -1) {
    return profile;
  }

  const newDetailOrder = arrayMove(activeItems, oldIndex, newIndex);
  const baseContact = profile.contactDisplayOrder?.length
    ? [...profile.contactDisplayOrder]
    : defaultContactDisplayOrder(reorderableFields);

  const mappedActiveId = formFieldToPreviewField(activeId);
  const mappedOverId = formFieldToPreviewField(overId);

  let newContactDisplayOrder = baseContact;
  if (
    mappedActiveId !== mappedOverId &&
    reorderableFields.includes(mappedActiveId) &&
    reorderableFields.includes(mappedOverId) &&
    baseContact.includes(mappedActiveId) &&
    baseContact.includes(mappedOverId)
  ) {
    const cdoOldIndex = baseContact.indexOf(mappedActiveId);
    const cdoNewIndex = baseContact.indexOf(mappedOverId);
    if (cdoOldIndex !== -1 && cdoNewIndex !== -1) {
      newContactDisplayOrder = arrayMove(baseContact, cdoOldIndex, cdoNewIndex);
    }
  }

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
  const items = currentOrder.length
    ? [...currentOrder]
    : [...allowedIds];
  const activeItems = [...new Set([...items, ...allowedIds])].filter((id) => allowedIds.includes(id));
  const oldIndex = activeItems.indexOf(activeId);
  const newIndex = activeItems.indexOf(overId);
  if (oldIndex === -1 || newIndex === -1) return currentOrder;
  return arrayMove(activeItems, oldIndex, newIndex);
}
