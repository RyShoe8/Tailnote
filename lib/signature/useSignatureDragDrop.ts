'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  applyBrandFieldsToContactOrder,
  fromSigOrderId,
  hitTestDropZone,
  type MeasuredDropZone,
  reorderPreviewFields,
  toPreviewFieldId,
  brandOrderFromContactOrder,
} from '@/lib/signature/fieldOrder';
import {
  defaultContactDisplayOrder,
  reorderContactDisplayOrder,
  reorderDetailAndContact,
  reorderBrandOrder,
  resolvePreviewDropTarget,
  profileAfterContactReorder,
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
  const dropZonesRef = useRef<MeasuredDropZone[]>([]);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  const reorderableFields = useMemo(
    () => getLayoutReorderRules(layout).reorderableFields,
    [layout],
  );

  const setDropZones = useCallback((zones: MeasuredDropZone[]) => {
    dropZonesRef.current = zones;
  }, []);

  const handlePreviewDragStart = useCallback((event: DragStartEvent) => {
    const fieldId = String(event.active.id);
    pendingPreviewDropRef.current = null;
    lastPointerRef.current = null;
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
    lastPointerRef.current = null;
    setIsDraggingToPreview(false);
    setDraggedFieldId(null);
    setDragStatus(EMPTY_DRAG_STATUS);
  }, []);

  useEffect(() => {
    if (!isDraggingToPreview) return;
    const onPointerMove = (event: PointerEvent) => {
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      const hit = hitTestDropZone(dropZonesRef.current, event.clientX, event.clientY);
      if (hit) {
        pendingPreviewDropRef.current = { insertAfterField: hit.insertAfterField };
        setDragStatus((prev) => ({
          ...prev,
          overTarget: 'preview-zone',
          zoneInsertAfter: hit.insertAfterField,
        }));
      }
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [isDraggingToPreview]);

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
      setProfile((p) =>
        profileAfterContactReorder(
          p,
          reorderContactDisplayOrder(
            p.contactDisplayOrder?.length
              ? p.contactDisplayOrder
              : defaultContactDisplayOrder(reorderableFields),
            rawFieldId,
            insertAfterField,
          ),
          reorderableFields,
        ),
      );
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
      const sigOrderHit = pointerCollisions.find((c) => String(c.id).startsWith('sig-order:'));
      if (sigOrderHit) return [sigOrderHit];
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

      const pointer = lastPointerRef.current;
      const pointerHit = pointer
        ? hitTestDropZone(dropZonesRef.current, pointer.x, pointer.y)
        : null;

      const previewDrop =
        resolvePreviewDropTarget(
          overId,
          pendingPreviewDropRef.current,
          over?.data.current as { insertAfterField?: string | null } | undefined,
        ) ??
        (pointerHit ? { insertAfterField: pointerHit.insertAfterField } : null);

      const activePreview = toPreviewFieldId(activeId);
      const overPreview = overId ? toPreviewFieldId(overId) : null;

      if (
        activePreview &&
        overPreview &&
        activePreview !== overPreview &&
        reorderableFields.includes(activePreview) &&
        reorderableFields.includes(overPreview)
      ) {
        setProfile((p) => {
          const base = p.contactDisplayOrder?.length
            ? p.contactDisplayOrder
            : defaultContactDisplayOrder(reorderableFields);
          const nextContact = reorderPreviewFields(
            base,
            activePreview,
            overPreview,
            reorderableFields,
          );
          const nextProfile = profileAfterContactReorder(p, nextContact, reorderableFields);
          const touchesBrand =
            activePreview === 'companyName' ||
            activePreview === 'website' ||
            overPreview === 'companyName' ||
            overPreview === 'website';
          if (touchesBrand && setBrandOrder) {
            setBrandOrder(brandOrderFromContactOrder(nextProfile.contactDisplayOrder ?? nextContact));
          }
          return nextProfile;
        });
        setDropFailedMessage(null);
        clearDragState();
        return;
      }

      if (
        previewDrop &&
        activePreview &&
        reorderableFields.includes(activePreview)
      ) {
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
            const nextBrand = reorderBrandOrder(
              brandOrder ?? [],
              activeId,
              overId,
              BRAND_SORTABLE_IDS,
            );
            setBrandOrder(nextBrand);
            setProfile((p) =>
              profileAfterContactReorder(
                p,
                applyBrandFieldsToContactOrder(
                  p.contactDisplayOrder?.length
                    ? p.contactDisplayOrder
                    : defaultContactDisplayOrder(reorderableFields),
                  nextBrand,
                  reorderableFields,
                ),
                reorderableFields,
              ),
            );
          }
          clearDragState();
          return;
        }

        setProfile((p) => reorderDetailAndContact(p, activeId, overId, reorderableFields));
        setDropFailedMessage(null);
      } else if ((hadPendingPreviewDrop || pointerHit) && isLgUp && activePreview) {
        setDropFailedMessage('Could not place the field — try the Signature field order list below the preview.');
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
    setDropZones,
  };
}
