'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Contact row fields that can be reordered in the preview. */
const CONTACT_ROW_FIELDS = new Set([
  'companyName',
  'email',
  'website',
  'officePhone',
  'mobilePhone',
]);

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
};

type DropZone = {
  id: string;
  top: number;
  left: number;
  width: number;
  /** Field name of the row above this insertion line, or null if inserting at top. */
  insertAfterField: string | null;
};

type FieldHighlight = {
  fieldId: string;
  top: number;
  left: number;
  width: number;
  height: number;
};

type Props = {
  /** Ref to the wrapper div that contains the preview frame. */
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  draggedFieldId: string | null;
  onReorder: (fieldId: string, insertAfterField: string | null) => void;
};

/**
 * Transparent overlay that sits on top of the signature preview.
 * When a drag is in progress, it highlights the dragged field's position
 * and shows glowing insertion lines between contact rows for reordering.
 */
export function PreviewDropOverlay({
  wrapperRef,
  isDragging,
  draggedFieldId,
  onReorder,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [fieldHighlight, setFieldHighlight] = useState<FieldHighlight | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Measure element positions and build drop zones + highlight
  const measure = useCallback(() => {
    if (!isDragging || !wrapperRef.current || !overlayRef.current) {
      setDropZones([]);
      setFieldHighlight(null);
      return;
    }

    const contentEl = wrapperRef.current.querySelector('.mobile-signature-scale-root');
    if (!contentEl) return;

    const overlayRect = overlayRef.current.getBoundingClientRect();

    // Highlight the dragged field in the preview
    if (draggedFieldId) {
      // Map form field IDs to data-sig-field attribute names
      const attrName =
        draggedFieldId === 'firstName' || draggedFieldId === 'lastName'
          ? 'name'
          : draggedFieldId === 'avatarUrl'
            ? 'avatar'
            : draggedFieldId === 'logoUrl'
              ? 'logo'
              : draggedFieldId;
      const fieldEl = contentEl.querySelector(`[data-sig-field="${attrName}"]`);
      if (fieldEl) {
        const rect = fieldEl.getBoundingClientRect();
        setFieldHighlight({
          fieldId: attrName,
          top: rect.top - overlayRect.top,
          left: rect.left - overlayRect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setFieldHighlight(null);
      }
    }

    // Only show drop zones for contact-row fields
    const normalizedId =
      draggedFieldId === 'firstName' || draggedFieldId === 'lastName'
        ? 'name'
        : draggedFieldId === 'avatarUrl'
          ? 'avatar'
          : draggedFieldId === 'logoUrl'
            ? 'logo'
            : draggedFieldId;
    if (!normalizedId || !CONTACT_ROW_FIELDS.has(normalizedId)) {
      setDropZones([]);
      return;
    }

    // Find visible contact row elements in the preview
    const allSigFields = contentEl.querySelectorAll('[data-sig-field]');
    const contactEls = Array.from(allSigFields).filter((el) =>
      CONTACT_ROW_FIELDS.has(el.getAttribute('data-sig-field') || '')
    );

    const zones: DropZone[] = [];
    for (let i = 0; i <= contactEls.length; i++) {
      const prev = i > 0 ? contactEls[i - 1] : null;
      const next = i < contactEls.length ? contactEls[i] : null;
      const prevField = prev?.getAttribute('data-sig-field') || null;
      const nextField = next?.getAttribute('data-sig-field') || null;

      // Skip zone immediately before or after the dragged item (no-op position)
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
        width: refRect.width,
        insertAfterField: prevField,
      });
    }

    setDropZones(zones);
  }, [isDragging, draggedFieldId, wrapperRef]);

  // Re-measure when drag state changes
  useEffect(() => {
    measure();
  }, [measure]);

  // Also re-measure on resize
  useEffect(() => {
    if (!isDragging) return;
    const handler = () => measure();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isDragging, measure]);

  const handleDrop = useCallback(
    (e: React.DragEvent, zone: DropZone) => {
      e.preventDefault();
      e.stopPropagation();
      const fieldId = e.dataTransfer.getData('application/sig-field');
      if (fieldId) {
        onReorder(fieldId, zone.insertAfterField);
      }
      setHoveredZoneId(null);
    },
    [onReorder]
  );

  const handleDragOver = useCallback((e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setHoveredZoneId(zoneId);
  }, []);

  const handleOverlayDragLeave = useCallback((e: React.DragEvent) => {
    // Only reset if truly leaving the overlay (not moving between children)
    if (!overlayRef.current?.contains(e.relatedTarget as Node)) {
      setHoveredZoneId(null);
    }
  }, []);

  if (!isDragging) return null;

  const isContactField =
    draggedFieldId && CONTACT_ROW_FIELDS.has(draggedFieldId);
  const label = draggedFieldId ? FIELD_LABELS[draggedFieldId] || draggedFieldId : '';

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
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDragLeave={handleOverlayDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        setHoveredZoneId(null);
      }}
    >
      {/* Subtle backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(59, 130, 246, 0.03)',
          borderRadius: 8,
          border: '2px dashed rgba(59, 130, 246, 0.20)',
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Label banner */}
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 12,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          letterSpacing: '0.01em',
        }}
      >
        {isContactField
          ? `Drop "${label}" to reorder`
          : `"${label}" position in signature`}
      </div>

      {/* Field highlight */}
      {fieldHighlight && (
        <div
          style={{
            position: 'absolute',
            top: fieldHighlight.top - 2,
            left: fieldHighlight.left - 4,
            width: fieldHighlight.width + 8,
            height: fieldHighlight.height + 4,
            border: '2px solid rgba(59, 130, 246, 0.45)',
            borderRadius: 6,
            backgroundColor: 'rgba(59, 130, 246, 0.06)',
            pointerEvents: 'none',
            transition: 'all 0.15s ease',
          }}
        />
      )}

      {/* Drop zone insertion lines */}
      {dropZones.map((zone) => {
        const isHovered = hoveredZoneId === zone.id;
        return (
          <div
            key={zone.id}
            style={{
              position: 'absolute',
              top: zone.top - 14,
              left: zone.left - 4,
              width: zone.width + 8,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'copy',
              borderRadius: 4,
            }}
            onDragOver={(e) => handleDragOver(e, zone.id)}
            onDragLeave={() => setHoveredZoneId(null)}
            onDrop={(e) => handleDrop(e, zone)}
          >
            {/* The glowing line */}
            <div
              style={{
                width: '100%',
                height: isHovered ? 3 : 2,
                backgroundColor: isHovered
                  ? 'rgba(59, 130, 246, 0.85)'
                  : 'rgba(59, 130, 246, 0.35)',
                borderRadius: 2,
                boxShadow: isHovered
                  ? '0 0 8px rgba(59, 130, 246, 0.5), 0 0 2px rgba(59, 130, 246, 0.3)'
                  : '0 0 3px rgba(59, 130, 246, 0.15)',
                transition: 'all 0.12s ease',
                position: 'relative',
              }}
            >
              {/* Center plus icon */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isHovered ? 20 : 16,
                  height: isHovered ? 20 : 16,
                  borderRadius: '50%',
                  backgroundColor: isHovered
                    ? 'rgba(59, 130, 246, 0.9)'
                    : 'rgba(59, 130, 246, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.12s ease',
                  boxShadow: isHovered
                    ? '0 0 6px rgba(59, 130, 246, 0.4)'
                    : 'none',
                }}
              >
                <svg
                  width={isHovered ? 12 : 10}
                  height={isHovered ? 12 : 10}
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{ transition: 'all 0.12s ease' }}
                >
                  <line
                    x1="6"
                    y1="2"
                    x2="6"
                    y2="10"
                    stroke="#fff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="2"
                    y1="6"
                    x2="10"
                    y2="6"
                    stroke="#fff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
