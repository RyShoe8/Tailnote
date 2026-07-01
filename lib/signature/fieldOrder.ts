import {
  applyBrandFieldOrder,
  formFieldToPreviewField,
  getLayoutReorderRules,
  isFieldReorderable,
  resolveFieldOrder,
  type SignatureLayout,
} from 'emailsignature-engine';

export const DEFAULT_DETAIL_ORDER = [
  'avatarUrl',
  'firstName',
  'lastName',
  'title',
  'email',
  'officePhone',
  'mobilePhone',
] as const;

export const SIG_ORDER_PREFIX = 'sig-order:';

export function toSigOrderId(previewFieldId: string): string {
  return `${SIG_ORDER_PREFIX}${previewFieldId}`;
}

export function fromSigOrderId(sortableId: string): string | null {
  return sortableId.startsWith(SIG_ORDER_PREFIX) ? sortableId.slice(SIG_ORDER_PREFIX.length) : null;
}

/** Normalize any editor sortable id to a preview field id when possible. */
export function toPreviewFieldId(sortableId: string): string | null {
  const fromSig = fromSigOrderId(sortableId);
  if (fromSig) return fromSig;
  if (sortableId === 'companyName' || sortableId === 'website') return sortableId;
  const mapped = formFieldToPreviewField(sortableId);
  return mapped || null;
}

export function brandOrderFromContactOrder(contactOrder: readonly string[]): string[] {
  const order: string[] = [];
  for (const field of contactOrder) {
    if ((field === 'companyName' || field === 'website') && !order.includes(field)) {
      order.push(field);
    }
  }
  for (const field of ['companyName', 'website'] as const) {
    if (!order.includes(field)) order.push(field);
  }
  return order;
}

export type MeasuredDropZone = {
  id: string;
  insertAfterField: string | null;
  clientRect: { top: number; left: number; width: number; height: number };
};

export function hitTestDropZone(
  zones: readonly MeasuredDropZone[],
  clientX: number,
  clientY: number,
): MeasuredDropZone | null {
  for (const zone of zones) {
    const { top, left, width, height } = zone.clientRect;
    if (
      clientX >= left &&
      clientX <= left + width &&
      clientY >= top &&
      clientY <= top + height
    ) {
      return zone;
    }
  }
  return null;
}

/** Preview field ids in signature order for the active layout. */
export function resolvePreviewFieldOrder(
  layout: SignatureLayout,
  contactDisplayOrder?: string[],
  brandOrder?: string[],
): string[] {
  const rules = getLayoutReorderRules(layout);
  return resolveFieldOrder(rules, contactDisplayOrder, brandOrder).filter((field) =>
    isFieldReorderable(rules, field),
  );
}

export function defaultContactOrder(reorderableFields: readonly string[]): string[] {
  return [...reorderableFields];
}

/** Derive contactDisplayOrder from sidebar detailOrder after a drag. */
export function deriveContactOrderFromDetailOrder(
  detailOrder: readonly string[],
  reorderableFields: readonly string[],
  currentContactOrder: readonly string[],
): string[] {
  const previewSeq: string[] = [];
  for (const formId of detailOrder) {
    const previewId = formFieldToPreviewField(formId);
    if (!reorderableFields.includes(previewId)) continue;
    if (!previewSeq.includes(previewId)) previewSeq.push(previewId);
  }

  if (!previewSeq.length) {
    return currentContactOrder.length ? [...currentContactOrder] : defaultContactOrder(reorderableFields);
  }

  const base = currentContactOrder.length ? [...currentContactOrder] : defaultContactOrder(reorderableFields);
  const allowed = new Set(reorderableFields);
  const result: string[] = [];
  for (const field of previewSeq) {
    if (allowed.has(field)) result.push(field);
  }
  for (const field of base) {
    if (!result.includes(field)) result.push(field);
  }
  return result;
}

/** Keep sidebar detailOrder aligned when contactDisplayOrder changes (preview drop / order panel). */
export function syncDetailOrderFromContact(
  detailOrder: readonly string[] | undefined,
  contactOrder: readonly string[],
  reorderableFields: readonly string[],
): string[] {
  const detail = detailOrder?.length ? [...detailOrder] : [...DEFAULT_DETAIL_ORDER];
  const reorderableInDetail = detail.filter((id) =>
    reorderableFields.includes(formFieldToPreviewField(id)),
  );
  const previewSeq = contactOrder.filter((f) => reorderableFields.includes(f));

  const sorted = [...reorderableInDetail].sort((a, b) => {
    const pa = formFieldToPreviewField(a);
    const pb = formFieldToPreviewField(b);
    const ia = previewSeq.indexOf(pa);
    const ib = previewSeq.indexOf(pb);
    if (ia === -1 && ib === -1) return detail.indexOf(a) - detail.indexOf(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    if (pa !== pb) return ia - ib;
    return detail.indexOf(a) - detail.indexOf(b);
  });

  let sortIdx = 0;
  return detail.map((id) => {
    if (reorderableFields.includes(formFieldToPreviewField(id))) {
      const next = sorted[sortIdx++];
      return next ?? id;
    }
    return id;
  });
}

export function buildDetailOrderForSidebar(
  detailOrder: readonly string[] | undefined,
  contactDisplayOrder: readonly string[] | undefined,
  reorderableFields: readonly string[],
): string[] {
  const baseDetail = detailOrder?.length ? [...detailOrder] : [...DEFAULT_DETAIL_ORDER];
  const activeDetail = [...new Set([...baseDetail, ...DEFAULT_DETAIL_ORDER])].filter((id) =>
    DEFAULT_DETAIL_ORDER.includes(id as (typeof DEFAULT_DETAIL_ORDER)[number]),
  );
  if (!contactDisplayOrder?.length) return activeDetail;
  return syncDetailOrderFromContact(activeDetail, contactDisplayOrder, reorderableFields);
}

export function applyBrandFieldsToContactOrder(
  contactOrder: readonly string[],
  brandOrder: readonly string[],
  reorderableFields: readonly string[],
): string[] {
  const hasBrand = brandOrder.some(
    (f) => (f === 'companyName' || f === 'website') && reorderableFields.includes(f),
  );
  if (!hasBrand) return [...contactOrder];
  const base = contactOrder.length ? [...contactOrder] : defaultContactOrder(reorderableFields);
  return applyBrandFieldOrder(base, [...brandOrder]);
}

export function reorderPreviewFields(
  currentOrder: readonly string[],
  activeField: string,
  overField: string,
  reorderableFields: readonly string[],
): string[] {
  const base = currentOrder.length ? [...currentOrder] : defaultContactOrder(reorderableFields);
  const oldIndex = base.indexOf(activeField);
  const newIndex = base.indexOf(overField);
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return base;
  const next = [...base];
  next.splice(oldIndex, 1);
  next.splice(newIndex, 0, activeField);
  return next;
}
