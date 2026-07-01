'use client';

import { useLayoutEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getLayoutReorderRules,
  isFieldReorderable,
  type SignatureLayout,
} from 'emailsignature-engine';
import { fieldLabel } from '@/lib/signature/dragDropStatus';
import {
  parseZoneInsertAfter,
  resolvePreviewFieldOrder,
  toPreviewDragId,
  toZoneId,
} from '@/lib/signature/fieldOrder';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const ZONE_HIT_HEIGHT = 10;

type MeasuredField = {
  fieldId: string;
  top: number;
  left: number;
  width: number;
  height: number;
};

type Props = {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  layout: SignatureLayout;
  contactDisplayOrder?: string[];
  brandOrder?: string[];
  isDragging: boolean;
  activeZoneId: string | null;
  htmlKey: string | number;
};

function measureFields(
  wrapper: HTMLElement,
  orderedFields: readonly string[],
): MeasuredField[] {
  const wrapperRect = wrapper.getBoundingClientRect();
  const byField = new Map<string, DOMRect>();

  wrapper.querySelectorAll('[data-sig-field]').forEach((node) => {
    const fieldId = node.getAttribute('data-sig-field');
    if (!fieldId || fieldId === 'contactRow') return;
    const rect = node.getBoundingClientRect();
    const existing = byField.get(fieldId);
    if (!existing) {
      byField.set(fieldId, rect);
      return;
    }
    const top = Math.min(existing.top, rect.top);
    const left = Math.min(existing.left, rect.left);
    const right = Math.max(existing.right, rect.right);
    const bottom = Math.max(existing.bottom, rect.bottom);
    byField.set(
      fieldId,
      new DOMRect(left, top, right - left, bottom - top),
    );
  });

  const measured: MeasuredField[] = [];
  for (const fieldId of orderedFields) {
    const rect = byField.get(fieldId);
    if (!rect) continue;
    measured.push({
      fieldId,
      top: rect.top - wrapperRect.top,
      left: rect.left - wrapperRect.left,
      width: rect.width,
      height: rect.height,
    });
  }
  return measured;
}

function InsertionZone({
  id,
  top,
  left,
  width,
  active,
}: {
  id: string;
  top: number;
  left: number;
  width: number;
  active: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { insertAfterField: parseZoneInsertAfter(id) },
  });

  return (
    <div
      ref={setNodeRef}
      className="absolute z-20 pointer-events-auto"
      style={{
        top: top - ZONE_HIT_HEIGHT / 2,
        left,
        width,
        height: ZONE_HIT_HEIGHT,
      }}
    >
      <div
        className={cn(
          'absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-opacity',
          isOver || active ? 'bg-primary opacity-100' : 'bg-primary/40 opacity-0',
        )}
      />
    </div>
  );
}

function FieldHandle({
  fieldId,
  top,
  left,
  width,
  height,
  show,
}: {
  fieldId: string;
  top: number;
  left: number;
  width: number;
  height: number;
  show: boolean;
}) {
  const id = toPreviewDragId(fieldId);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        top,
        left: Math.max(0, left - 22),
        width: 20,
        height: Math.max(height, 20),
      }}
      className={cn(
        'absolute z-10 flex items-center justify-center rounded border bg-background/90 text-muted-foreground shadow-sm transition-opacity',
        show || isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none',
        'hover:text-foreground hover:border-primary/40 cursor-grab active:cursor-grabbing',
        isDragging && 'border-primary ring-1 ring-primary',
      )}
      aria-label={`Drag to reorder ${fieldLabel(fieldId)}`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3.5 w-3.5" />
    </button>
  );
}

export function SignaturePreviewReorderLayer({
  wrapperRef,
  layout,
  contactDisplayOrder,
  brandOrder,
  isDragging,
  activeZoneId,
  htmlKey,
}: Props) {
  const [fields, setFields] = useState<MeasuredField[]>([]);
  const [hovered, setHovered] = useState(false);

  const rules = getLayoutReorderRules(layout);
  const orderedFields = resolvePreviewFieldOrder(layout, contactDisplayOrder, brandOrder).filter(
    (field) => isFieldReorderable(rules, field),
  );
  const sortableIds = orderedFields.map((field) => toPreviewDragId(field));
  const orderedFieldsKey = orderedFields.join(',');

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      setFields([]);
      return;
    }

    const update = () => {
      const next = measureFields(wrapper, orderedFields);
      setFields(next);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapper);
    wrapper.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', update, { once: true });
    });
    return () => ro.disconnect();
    // orderedFieldsKey mirrors orderedFields for a stable dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remeasure when visible field order changes
  }, [wrapperRef, orderedFieldsKey, htmlKey]);

  if (!fields.length) return null;

  const showHandles = hovered || isDragging;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        {isDragging
          ? fields.map((field, index) => (
              <InsertionZone
                key={toZoneId(index === 0 ? null : fields[index - 1]!.fieldId)}
                id={toZoneId(index === 0 ? null : fields[index - 1]!.fieldId)}
                top={field.top}
                left={field.left}
                width={field.width}
                active={activeZoneId === toZoneId(index === 0 ? null : fields[index - 1]!.fieldId)}
              />
            ))
          : null}
        {isDragging && fields.length > 0 ? (
          <InsertionZone
            key={toZoneId(fields[fields.length - 1]!.fieldId)}
            id={toZoneId(fields[fields.length - 1]!.fieldId)}
            top={fields[fields.length - 1]!.top + fields[fields.length - 1]!.height}
            left={fields[fields.length - 1]!.left}
            width={fields[fields.length - 1]!.width}
            active={activeZoneId === toZoneId(fields[fields.length - 1]!.fieldId)}
          />
        ) : null}
        {fields.map((field) => (
          <div key={field.fieldId} className="pointer-events-auto">
            <FieldHandle
              fieldId={field.fieldId}
              top={field.top}
              left={field.left}
              width={field.width}
              height={field.height}
              show={showHandles}
            />
          </div>
        ))}
      </SortableContext>
    </div>
  );
}
