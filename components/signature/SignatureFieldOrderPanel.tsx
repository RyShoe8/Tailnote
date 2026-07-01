'use client';

import { useCallback, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
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
  onOrderChange: (orderedPreviewFields: string[]) => void;
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
        'flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-sm',
        isDragging && 'border-primary/60 shadow-sm',
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
        {reorderable ? <GripVertical className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
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
  onOrderChange,
}: Props) {
  const [orderUpdated, setOrderUpdated] = useState(false);
  const rules = getLayoutReorderRules(layout);
  const previewFields = resolvePreviewFieldOrder(layout, contactDisplayOrder, brandOrder);
  const visibleFields = previewFields.filter(
    (field) => !isFieldHidden(field, hiddenProfileFields, hiddenBrandFields),
  );
  const sortableItems = visibleFields.map((field) => toSigOrderId(field));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sortableItems.indexOf(String(active.id));
      const newIndex = sortableItems.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;
      const nextOrder = arrayMove(visibleFields, oldIndex, newIndex);
      onOrderChange(nextOrder);
      setOrderUpdated(true);
      window.setTimeout(() => setOrderUpdated(false), 1800);
    },
    [onOrderChange, sortableItems, visibleFields],
  );

  if (!visibleFields.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Add name and email to reorder fields in your signature.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Signature field order</p>
          <p className="text-xs text-muted-foreground">Drag to change how fields appear in the preview.</p>
        </div>
        {orderUpdated ? <span className="text-xs text-primary shrink-0">Updated</span> : null}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
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
      </DndContext>
    </div>
  );
}
