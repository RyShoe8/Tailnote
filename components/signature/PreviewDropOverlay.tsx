'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { formFieldToPreviewField, isFieldReorderable, type LayoutReorderRules } from 'emailsignature-engine';

/** Human-readable labels for contact fields. */
const FIELD_LABELS: Record<string, string> = {
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

type DropZone = {
  id: string;
  top: number;
  left: number;
  width: number;
  insertAfterField: string | null;
  label: string;
};

type FieldHighlight = {
  fieldId: string;
  top: number;
  left: number;
  width: number;
  height: number;
};

type Props = {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  draggedFieldId: string | null;
  reorderableFields: readonly string[];
  contactDisplayOrder?: string[];
};

function zoneLabel(insertAfterField: string | null, nextField: string | null): string {
  if (insertAfterField === null) {
    return nextField ? `Drop at top (above ${FIELD_LABELS[nextField] ?? nextField})` : 'Drop at top';
  }
  return `Drop below ${FIELD_LABELS[insertAfterField] ?? insertAfterField}`;
}

export function PreviewDropOverlay({
  wrapperRef,
  isDragging,
  draggedFieldId,
  reorderableFields,
  contactDisplayOrder,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [fieldHighlight, setFieldHighlight] = useState<FieldHighlight | null>(null);

  const reorderableSet = useRef(new Set(reorderableFields));
  reorderableSet.current = new Set(reorderableFields);

  const measure = useCallback(() => {
    void contactDisplayOrder;
    if (!isDragging || !wrapperRef.current || !overlayRef.current) {
      setDropZones([]);
      setFieldHighlight(null);
      return;
    }

    const contentEl = wrapperRef.current.querySelector('.mobile-signature-scale-root');
    if (!contentEl) return;

    const overlayRect = overlayRef.current.getBoundingClientRect();
    const normalizedId = draggedFieldId ? formFieldToPreviewField(draggedFieldId) : null;

    if (draggedFieldId && normalizedId) {
      const fieldEl = contentEl.querySelector(`[data-sig-field="${normalizedId}"]`);
      if (fieldEl) {
        const rect = fieldEl.getBoundingClientRect();
        setFieldHighlight({
          fieldId: normalizedId,
          top: rect.top - overlayRect.top,
          left: rect.left - overlayRect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setFieldHighlight(null);
      }
    }

    if (!normalizedId || !reorderableSet.current.has(normalizedId)) {
      setDropZones([]);
      return;
    }

    const allSigFields = contentEl.querySelectorAll('[data-sig-field]');
    const contactEls = Array.from(allSigFields).filter((el) => {
      const attr = el.getAttribute('data-sig-field') || '';
      return reorderableSet.current.has(attr);
    });

    const zones: DropZone[] = [];
    for (let i = 0; i <= contactEls.length; i++) {
      const prev = i > 0 ? contactEls[i - 1] : null;
      const next = i < contactEls.length ? contactEls[i] : null;
      const prevField = prev?.getAttribute('data-sig-field') || null;
      const nextField = next?.getAttribute('data-sig-field') || null;

      if (prevField === normalizedId || nextField === normalizedId) continue;

      const prevRect = prev?.getBoundingClientRect();
      const nextRect = next?.getBoundingClientRect();

      let top: number;
      if (prevRect && nextRect) {
        top = (prevRect.bottom + nextRect.top) / 2 - overlayRect.top;
      } else if (prevRect) {
        top = prevRect.bottom + 4 - overlayRect.top;
      } else if (nextRect) {
        top = nextRect.top - 4 - overlayRect.top;
      } else {
        continue;
      }

      const refRect = nextRect || prevRect!;
      zones.push({
        id: `zone-${i}`,
        top,
        left: refRect.left - overlayRect.left,
        width: Math.max(refRect.width, 150),
        insertAfterField: prevField,
        label: zoneLabel(prevField, nextField),
      });
    }

    setDropZones(zones);
  }, [contactDisplayOrder, draggedFieldId, isDragging, wrapperRef]);

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

  const normalizedDragId = draggedFieldId ? formFieldToPreviewField(draggedFieldId) : null;
  const rules: LayoutReorderRules = {
    layout: 'default',
    reorderableFields,
    fixedFields: [],
  };
  const isReorderableField =
    normalizedDragId && isFieldReorderable(rules, normalizedDragId);
  const label = draggedFieldId ? FIELD_LABELS[draggedFieldId] || FIELD_LABELS[normalizedDragId ?? ''] || draggedFieldId : '';

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        pointerEvents: 'auto',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(59, 130, 246, 0.04)',
          borderRadius: 8,
          border: '2px dashed rgba(59, 130, 246, 0.35)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: isReorderableField ? 'rgba(59, 130, 246, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          padding: '6px 14px',
          borderRadius: 16,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        {isReorderableField
          ? `Drop "${label}" to reorder`
          : `"${label}" is fixed in this layout`}
      </div>

      {fieldHighlight && (
        <div
          style={{
            position: 'absolute',
            top: fieldHighlight.top - 2,
            left: fieldHighlight.left - 4,
            width: fieldHighlight.width + 8,
            height: fieldHighlight.height + 4,
            border: '2px solid rgba(59, 130, 246, 0.55)',
            borderRadius: 6,
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            pointerEvents: 'none',
          }}
        />
      )}

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
      style={{
        position: 'absolute',
        top: zone.top - 14,
        left: zone.left - 8,
        width: zone.width + 16,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        zIndex: 30,
      }}
    >
      <div
        style={{
          width: '100%',
          height: 3,
          backgroundColor: isOver ? 'rgba(59, 130, 246, 1)' : 'rgba(59, 130, 246, 0.65)',
          borderRadius: 2,
          boxShadow: isOver ? '0 0 8px rgba(59, 130, 246, 0.8)' : '0 0 4px rgba(59, 130, 246, 0.4)',
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: -22,
            transform: 'translateX(-50%)',
            fontSize: 11,
            fontWeight: 600,
            color: isOver ? 'rgba(37, 99, 235, 1)' : 'rgba(37, 99, 235, 0.85)',
            backgroundColor: 'rgba(255,255,255,0.95)',
            padding: '2px 8px',
            borderRadius: 10,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(59, 130, 246, 0.35)',
          }}
        >
          {zone.label}
        </span>
      </div>
    </div>
  );
}
