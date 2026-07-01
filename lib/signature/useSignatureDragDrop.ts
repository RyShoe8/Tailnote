'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  getLayoutReorderRules,
  type SignatureLayout,
} from 'emailsignature-engine';
import type { SignatureProfile } from 'emailsignature-engine';
import {
  defaultContactDisplayOrder,
  reorderContactDisplayOrder,
  reorderDetailAndContact,
  reorderBrandOrder,
  resolvePreviewDropTarget,
  type PendingPreviewDrop,
} from '@/lib/signature/reorderDragDrop';
import {
  classifyDragOverTarget,
  getDragDropStatus,
  type SignatureDragStatus,
} from '@/lib/signature/dragDropStatus';

const BRAND_SORTABLE_IDS = ['companyName', 'website'] as const;

const EMPTY_DRAG_STATUS: SignatureDragStatus = {
  draggedFieldId: null,
  overTarget: 'none',
  zoneInsertAfter: null,
};

type UseSignatureDragDropOptions = {
  layout: SignatureLayout;
  profile: SignatureProfile;
  setProfile: React.Dispatch<React.SetStateAction<SignatureProfile>>;
  brandOrder?: string[];
  setBrandOrder?: (order: string[]) => void;
  previewWrapperRef: React.RefObject<HTMLDivElement | null>;
  isLgUp: boolean;
  dropZoneCount: number;
};

export function useSignatureDragDrop({
  layout,
  profile,
  setProfile,
  brandOrder,
  setBrandOrder,
  previewWrapperRef,
  isLgUp,
  dropZoneCount,
}: UseSignatureDragDropOptions) {
  const [isDraggingToPreview, setIsDraggingToPreview] = useState(false);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragStatus, setDragStatus] = useState<SignatureDragStatus>(EMPTY_DRAG_STATUS);
  const [dropFailedMessage, setDropFailedMessage] = useState<string | null>(null);
  const pendingPreviewDropRef = useRef<PendingPreviewDrop | null>(null);

  const reorderableFields = useMemo(
    () => getLayoutReorderRules(layout).reorderableFields,
    [layout],
  );

  const handlePreviewDragStart = useCallback((event: DragStartEvent) => {
    const fieldId = String(event.active.id);
    pendingPreviewDropRef.current = null;
    setDropFailedMessage(null);
    setIsDraggingToPreview(true);
    setDraggedFieldId(fieldId);
    setDragStatus({
      draggedFieldId: fieldId,
      overTarget: 'none',
      zoneInsertAfter: null,
    });
  }, []);

  const clearDragState = useCallback(() => {
    pendingPreviewDropRef.current = null;
    setIsDraggingToPreview(false);
    setDraggedFieldId(null);
    setDragStatus(EMPTY_DRAG_STATUS);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over ? String(event.over.id) : null;
    const { overTarget } = classifyDragOverTarget(overId);
    let zoneInsertAfter: string | null = null;
    if (overTarget === 'preview-zone' && event.over?.data.current) {
      const zone = event.over.data.current as { insertAfterField?: string | null };
      zoneInsertAfter = zone.insertAfterField ?? null;
      pendingPreviewDropRef.current = { insertAfterField: zoneInsertAfter };
    } else if (overTarget !== 'preview-zone') {
      pendingPreviewDropRef.current = null;
    }
    setDragStatus((prev) => ({
      ...prev,
      overTarget,
      zoneInsertAfter,
    }));
  }, []);

  const handleContactReorder = useCallback(
    (rawFieldId: string, insertAfterField: string | null) => {
      setProfile((p) => ({
        ...p,
        contactDisplayOrder: reorderContactDisplayOrder(
          p.contactDisplayOrder?.length
            ? p.contactDisplayOrder
            : defaultContactDisplayOrder(reorderableFields),
          rawFieldId,
          insertAfterField,
        ),
      }));
      setDropFailedMessage(null);
      clearDragState();
    },
    [clearDragState, reorderableFields, setProfile],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const pointerCollisions = pointerWithin(args);
      const zoneHit = pointerCollisions.find((c) => String(c.id).startsWith('zone-'));
      if (zoneHit) return [zoneHit];
      if (isDraggingToPreview && previewWrapperRef.current) {
        const rect = previewWrapperRef.current.getBoundingClientRect();
        const pointer = args.pointerCoordinates;
        if (
          pointer &&
          pointer.x >= rect.left &&
          pointer.x <= rect.right &&
          pointer.y >= rect.top &&
          pointer.y <= rect.bottom
        ) {
          const zoneCollisions = args.droppableContainers
            .filter((c) => String(c.id).startsWith('zone-'))
            .map((container) => {
              const collisions = pointerWithin({ ...args, droppableContainers: [container] });
              return collisions[0];
            })
            .filter(Boolean);
          if (zoneCollisions.length > 0) return zoneCollisions as typeof pointerCollisions;
        }
      }
      return closestCenter(args);
    },
    [isDraggingToPreview, previewWrapperRef],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const activeId = String(active.id);
      const overId = over ? String(over.id) : null;
      const hadPendingPreviewDrop = pendingPreviewDropRef.current !== null;

      const previewDrop = resolvePreviewDropTarget(
        overId,
        pendingPreviewDropRef.current,
        over?.data.current as { insertAfterField?: string | null } | undefined,
      );

      if (previewDrop) {
        handleContactReorder(activeId, previewDrop.insertAfterField);
        return;
      }

      if (overId?.startsWith('zone-')) {
        clearDragState();
        return;
      }

      if (overId && activeId !== overId) {
        if (BRAND_SORTABLE_IDS.includes(activeId as (typeof BRAND_SORTABLE_IDS)[number])) {
          if (setBrandOrder && BRAND_SORTABLE_IDS.includes(overId as (typeof BRAND_SORTABLE_IDS)[number])) {
            const next = reorderBrandOrder(
              brandOrder ?? [],
              activeId,
              overId,
              BRAND_SORTABLE_IDS,
            );
            setBrandOrder(next);
          }
          clearDragState();
          return;
        }

        setProfile((p) => reorderDetailAndContact(p, activeId, overId, reorderableFields));
        setDropFailedMessage(null);
      } else if (hadPendingPreviewDrop && isLgUp) {
        setDropFailedMessage('Could not place the field — try releasing directly over a highlighted slot.');
      }

      clearDragState();
    },
    [
      brandOrder,
      clearDragState,
      handleContactReorder,
      isLgUp,
      reorderableFields,
      setBrandOrder,
      setProfile,
    ],
  );

  const dragStatusMessage = useMemo(() => {
    if (dropFailedMessage) {
      return { message: dropFailedMessage, variant: 'warning' as const };
    }
    if (!isDraggingToPreview) return null;
    return getDragDropStatus({
      dragStatus,
      layout,
      reorderableFields,
      isLgUp,
      dropZoneCount,
    });
  }, [dragStatus, dropFailedMessage, dropZoneCount, isDraggingToPreview, isLgUp, layout, reorderableFields]);

  return {
    isDraggingToPreview,
    draggedFieldId,
    dragStatusMessage,
    reorderableFields,
    sensors,
    collisionDetection,
    handlePreviewDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
