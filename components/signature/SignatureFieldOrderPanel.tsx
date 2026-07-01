'use client';

import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getLayoutReorderRules,
  isFieldReorderable,
  type SignatureLayout,
} from 'emailsignature-engine';
import { fieldLabel } from '@/lib/signature/dragDropStatus';
import { resolvePreviewFieldOrder, toSigOrderId } from '@/lib/signature/fieldOrder';
import { GripVertical, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  layout: SignatureLayout;
  contactDisplayOrder?: string[];
  brandOrder?: string[];
  hiddenProfileFields?: string[];
  hiddenBrandFields?: string[];
};

function isFieldHidden(
  previewField: string,
  hiddenProfileFields: string[],
  hiddenBrandFields: string[],
): boolean {
  if (previewField === 'companyName' || previewField === 'website') {
    return hiddenBrandFields.includes(previewField);
  }
  if (previewField === 'name') {
    return hiddenProfileFields.includes('firstName') && hiddenProfileFields.includes('lastName');
  }
  if (previewField === 'email') return hiddenProfileFields.includes('email');
  if (previewField === 'title') return hiddenProfileFields.includes('title');
  if (previewField === 'officePhone') return hiddenProfileFields.includes('officePhone');
  if (previewField === 'mobilePhone') return hiddenProfileFields.includes('mobilePhone');
  return false;
}

function OrderRow({ id, label, reorderable }: { id: string; label: string; reorderable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !reorderable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm',
        isDragging && 'border-primary ring-1 ring-primary shadow-md',
        !reorderable && 'opacity-60',
      )}
    >
      <button
        type="button"
        className={cn(
          'shrink-0',
          reorderable
            ? 'cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing'
            : 'cursor-not-allowed text-muted-foreground/50',
        )}
        {...(reorderable ? { ...attributes, ...listeners } : {})}
        aria-label={reorderable ? `Drag to reorder ${label}` : `${label} is fixed in this layout`}
      >
        {reorderable ? <GripVertical className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      </button>
      <span className="font-medium">{label}</span>
    </div>
  );
}

export function SignatureFieldOrderPanel({
  layout,
  contactDisplayOrder,
  brandOrder,
  hiddenProfileFields = [],
  hiddenBrandFields = [],
}: Props) {
  const rules = getLayoutReorderRules(layout);
  const previewFields = resolvePreviewFieldOrder(layout, contactDisplayOrder, brandOrder);
  const visibleFields = previewFields.filter(
    (field) => !isFieldHidden(field, hiddenProfileFields, hiddenBrandFields),
  );
  const sortableItems = visibleFields.map((field) => toSigOrderId(field));

  if (!visibleFields.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Add name and email to reorder fields in your signature.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">Signature field order</p>
        <p className="text-xs text-muted-foreground">
          Drag to match how fields appear in your signature. This is the most reliable way to reorder.
        </p>
      </div>
      <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {visibleFields.map((field) => (
            <OrderRow
              key={field}
              id={toSigOrderId(field)}
              label={fieldLabel(field)}
              reorderable={isFieldReorderable(rules, field)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
