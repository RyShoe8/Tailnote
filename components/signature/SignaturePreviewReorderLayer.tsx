'use client';

import { useLayoutEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getLayoutEditorFields,
  type SignatureLayout,
} from 'emailsignature-engine';
import { fieldLabel } from '@/lib/signature/dragDropStatus';
import {
  parseZoneInsertAfter,
  resolvePreviewFieldOrder,
  toPreviewDragId,
  toZoneId,
} from '@/lib/signature/fieldOrder';
import { cn } from '@/lib/utils';

const ZONE_HIT_HEIGHT = 12;

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
  visible,
}: {
  id: string;
  top: number;
  left: number;
  width: number;
  visible: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { insertAfterField: parseZoneInsertAfter(id) },
  });

  if (!visible && !isOver) {
    return (
      <div
        ref={setNodeRef}
        className="absolute z-20 pointer-events-auto opacity-0"
        style={{
          top: top - ZONE_HIT_HEIGHT / 2,
          left,
          width,
          height: ZONE_HIT_HEIGHT,
        }}
      />
    );
  }

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
          'absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 rounded-full transition-all',
          isOver ? 'bg-primary h-0.5 opacity-100' : 'bg-primary/50 opacity-60',
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
        left,
        width,
        height,
      }}
      className={cn(
        'absolute z-10 rounded-sm border border-dashed transition-opacity',
        show || isDragging ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        isDragging
          ? 'border-primary/70 bg-primary/5'
          : 'border-transparent hover:border-primary/40 hover:bg-primary/5',
        'cursor-grab active:cursor-grabbing',
      )}
      aria-label={`Drag to reorder ${fieldLabel(fieldId)}`}
      {...attributes}
      {...listeners}
    >
      <span className="sr-only">Drag {fieldLabel(fieldId)}</span>
      <span
        className={cn(
          'absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary/50',
          isDragging && 'bg-primary',
        )}
      />
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

  const { reorderablePreviewFields } = getLayoutEditorFields(layout);
  const orderedFields = resolvePreviewFieldOrder(layout, contactDisplayOrder, brandOrder).filter(
    (field) => reorderablePreviewFields.includes(field),
  );
  const sortableIds = fields.map((field) => toPreviewDragId(field.fieldId));
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
          ? fields.map((field, index) => {
              const zoneId = toZoneId(index === 0 ? null : fields[index - 1]!.fieldId);
              return (
                <InsertionZone
                  key={zoneId}
                  id={zoneId}
                  top={field.top}
                  left={field.left}
                  width={field.width}
                  visible={activeZoneId === zoneId}
                />
              );
            })
          : null}
        {isDragging && fields.length > 0 ? (
          <InsertionZone
            key={toZoneId(fields[fields.length - 1]!.fieldId)}
            id={toZoneId(fields[fields.length - 1]!.fieldId)}
            top={fields[fields.length - 1]!.top + fields[fields.length - 1]!.height}
            left={fields[fields.length - 1]!.left}
            width={fields[fields.length - 1]!.width}
            visible={activeZoneId === toZoneId(fields[fields.length - 1]!.fieldId)}
          />
        ) : null}
        {fields.map((field) => (
          <FieldHandle
            key={field.fieldId}
            fieldId={field.fieldId}
            top={field.top}
            left={field.left}
            width={field.width}
            height={field.height}
            show={showHandles}
          />
        ))}
      </SortableContext>
    </div>
  );
}
