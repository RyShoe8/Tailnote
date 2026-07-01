'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { formFieldToPreviewField, isFieldReorderable, getLayoutReorderRules } from 'emailsignature-engine';
import type { MeasuredDropZone } from '@/lib/signature/fieldOrder';
import { cn } from '@/lib/utils';

type DropZone = {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
  insertAfterField: string | null;
  clientRect: { top: number; left: number; width: number; height: number };
};

type Props = {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  draggedFieldId: string | null;
  reorderableFields: readonly string[];
  layout: import('emailsignature-engine').SignatureLayout;
  contactDisplayOrder?: string[];
  onZoneCountChange?: (count: number) => void;
  onDropZonesChange?: (zones: MeasuredDropZone[]) => void;
};

const SLOT_HEIGHT = 56;
const SLOT_INSET_X = 8;

export function PreviewDropOverlay({
  wrapperRef,
  isDragging,
  draggedFieldId,
  reorderableFields,
  layout,
  contactDisplayOrder,
  onZoneCountChange,
  onDropZonesChange,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dropZones, setDropZones] = useState<DropZone[]>([]);

  const reorderableSet = useRef(new Set(reorderableFields));
  reorderableSet.current = new Set(reorderableFields);

  const measure = useCallback(() => {
    void contactDisplayOrder;
    if (!isDragging || !wrapperRef.current) {
      setDropZones([]);
      onZoneCountChange?.(0);
      onDropZonesChange?.([]);
      return;
    }

    const contentEl = wrapperRef.current.querySelector('.mobile-signature-scale-root');
    if (!contentEl) {
      setDropZones([]);
      onZoneCountChange?.(0);
      onDropZonesChange?.([]);
      return;
    }

    const overlayEl = overlayRef.current;
    const overlayRect = overlayEl
      ? overlayEl.getBoundingClientRect()
      : wrapperRef.current.getBoundingClientRect();
    const normalizedId = draggedFieldId ? formFieldToPreviewField(draggedFieldId) : null;
    const rules = getLayoutReorderRules(layout);

    if (!normalizedId || !isFieldReorderable(rules, normalizedId)) {
      setDropZones([]);
      onZoneCountChange?.(0);
      onDropZonesChange?.([]);
      return;
    }

    const allSigFields = contentEl.querySelectorAll('[data-sig-field]');
    const contactEls = Array.from(allSigFields).filter((el) => {
      const attr = el.getAttribute('data-sig-field') || '';
      return reorderableSet.current.has(attr);
    });

    const overlayWidth = overlayRect.width;
    const zones: DropZone[] = [];
    for (let i = 0; i <= contactEls.length; i++) {
      const prev = i > 0 ? contactEls[i - 1] : null;
      const next = i < contactEls.length ? contactEls[i] : null;
      const prevField = prev?.getAttribute('data-sig-field') || null;
      const nextField = next?.getAttribute('data-sig-field') || null;

      if (prevField === normalizedId || nextField === normalizedId) continue;

      const prevRect = prev?.getBoundingClientRect();
      const nextRect = next?.getBoundingClientRect();

      let centerY: number;
      if (prevRect && nextRect) {
        centerY = (prevRect.bottom + nextRect.top) / 2;
      } else if (prevRect) {
        centerY = prevRect.bottom + SLOT_HEIGHT / 2;
      } else if (nextRect) {
        centerY = nextRect.top - SLOT_HEIGHT / 2;
      } else {
        continue;
      }

      const top = centerY - SLOT_HEIGHT / 2 - overlayRect.top;
      const left = SLOT_INSET_X;
      const width = Math.max(overlayWidth - SLOT_INSET_X * 2, 150);
      const clientTop = centerY - SLOT_HEIGHT / 2;
      const clientLeft = overlayRect.left + SLOT_INSET_X;

      zones.push({
        id: `zone-${i}`,
        top,
        left,
        width,
        height: SLOT_HEIGHT,
        insertAfterField: prevField,
        clientRect: {
          top: clientTop,
          left: clientLeft,
          width,
          height: SLOT_HEIGHT,
        },
      });
    }

    setDropZones(zones);
    onZoneCountChange?.(zones.length);
    onDropZonesChange?.(
      zones.map((zone) => ({
        id: zone.id,
        insertAfterField: zone.insertAfterField,
        clientRect: zone.clientRect,
      })),
    );
  }, [contactDisplayOrder, draggedFieldId, isDragging, layout, onDropZonesChange, onZoneCountChange, wrapperRef]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useLayoutEffect(() => {
    if (!isDragging) return;
    const raf = requestAnimationFrame(() => measure());
    const handler = () => measure();
    window.addEventListener('resize', handler);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handler);
    };
  }, [isDragging, measure]);

  if (!isDragging) return null;

  const normalizedId = draggedFieldId ? formFieldToPreviewField(draggedFieldId) : null;
  const rules = getLayoutReorderRules(layout);
  const canReorder = normalizedId && isFieldReorderable(rules, normalizedId);

  if (!canReorder) return null;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-20 rounded-lg"
      style={{ pointerEvents: 'none' }}
    >
      {dropZones.map((zone) => (
        <DroppableZone key={zone.id} zone={zone} />
      ))}
    </div>
  );
}

function DroppableZone({ zone }: { zone: DropZone }) {
  const { setNodeRef, isOver } = useDroppable({
    id: zone.id,
    data: zone,
  });

  return (
    <div
      ref={setNodeRef}
      className="absolute z-30"
      style={{
        top: zone.top,
        left: zone.left,
        width: zone.width,
        height: zone.height,
        pointerEvents: 'auto',
      }}
    >
      <div
        className={cn(
          'h-full w-full rounded-md border-2 border-dashed transition-colors',
          isOver
            ? 'border-primary bg-primary/25 ring-2 ring-primary/50'
            : 'border-primary bg-primary/15',
        )}
      />
    </div>
  );
}
