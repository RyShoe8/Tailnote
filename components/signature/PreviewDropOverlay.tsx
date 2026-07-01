'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { formFieldToPreviewField, isFieldReorderable, getLayoutReorderRules } from 'emailsignature-engine';
import { cn } from '@/lib/utils';

type DropZone = {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
  insertAfterField: string | null;
};

type Props = {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  draggedFieldId: string | null;
  reorderableFields: readonly string[];
  layout: import('emailsignature-engine').SignatureLayout;
  contactDisplayOrder?: string[];
  onZoneCountChange?: (count: number) => void;
};

export function PreviewDropOverlay({
  wrapperRef,
  isDragging,
  draggedFieldId,
  reorderableFields,
  layout,
  contactDisplayOrder,
  onZoneCountChange,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dropZones, setDropZones] = useState<DropZone[]>([]);

  const reorderableSet = useRef(new Set(reorderableFields));
  reorderableSet.current = new Set(reorderableFields);

  const measure = useCallback(() => {
    void contactDisplayOrder;
    if (!isDragging || !wrapperRef.current || !overlayRef.current) {
      setDropZones([]);
      onZoneCountChange?.(0);
      return;
    }

    const contentEl = wrapperRef.current.querySelector('.mobile-signature-scale-root');
    if (!contentEl) {
      onZoneCountChange?.(0);
      return;
    }

    const overlayRect = overlayRef.current.getBoundingClientRect();
    const normalizedId = draggedFieldId ? formFieldToPreviewField(draggedFieldId) : null;
    const rules = getLayoutReorderRules(layout);

    if (!normalizedId || !isFieldReorderable(rules, normalizedId)) {
      setDropZones([]);
      onZoneCountChange?.(0);
      return;
    }

    const allSigFields = contentEl.querySelectorAll('[data-sig-field]');
    const contactEls = Array.from(allSigFields).filter((el) => {
      const attr = el.getAttribute('data-sig-field') || '';
      return reorderableSet.current.has(attr);
    });

    const slotHeight = 40;
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
        centerY = prevRect.bottom + slotHeight / 2;
      } else if (nextRect) {
        centerY = nextRect.top - slotHeight / 2;
      } else {
        continue;
      }

      const refRect = nextRect || prevRect!;
      zones.push({
        id: `zone-${i}`,
        top: centerY - slotHeight / 2 - overlayRect.top,
        left: refRect.left - overlayRect.left,
        width: Math.max(refRect.width, 150),
        height: slotHeight,
        insertAfterField: prevField,
      });
    }

    setDropZones(zones);
    onZoneCountChange?.(zones.length);
  }, [contactDisplayOrder, draggedFieldId, isDragging, layout, onZoneCountChange, wrapperRef]);

  useEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
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
          'h-full w-full rounded-md border border-dashed transition-colors',
          isOver
            ? 'border-primary bg-primary/12 ring-1 ring-primary/30'
            : 'border-primary/35 bg-primary/5',
        )}
      />
    </div>
  );
}
