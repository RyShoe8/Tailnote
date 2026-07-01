'use client';

import { useCallback, useMemo, useState } from 'react';
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
  brandOrderFromContactOrder,
  isZoneId,
  parseZoneInsertAfter,
  reorderPreviewFields,
  toPreviewFieldId,
} from '@/lib/signature/fieldOrder';
import {
  defaultContactDisplayOrder,
  reorderContactDisplayOrder,
  reorderDetailAndContact,
  reorderBrandOrder,
  profileAfterContactReorder,
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
};

export function useSignatureDragDrop({
  layout,
  profile,
  setProfile,
  brandOrder,
  setBrandOrder,
}: UseSignatureDragDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragStatus, setDragStatus] = useState<SignatureDragStatus>(EMPTY_DRAG_STATUS);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  const reorderableFields = useMemo(
    () => getLayoutReorderRules(layout).reorderableFields,
    [layout],
  );

  const applyContactReorder = useCallback(
    (nextContact: string[]) => {
      setProfile((p) => profileAfterContactReorder(p, nextContact, reorderableFields));
      if (
        setBrandOrder &&
        nextContact.some((field) => field === 'companyName' || field === 'website')
      ) {
        setBrandOrder(brandOrderFromContactOrder(nextContact));
      }
    },
    [reorderableFields, setBrandOrder, setProfile],
  );

  const handlePreviewDragStart = useCallback((event: DragStartEvent) => {
    const fieldId = String(event.active.id);
    setIsDragging(true);
    setDraggedFieldId(fieldId);
    setActiveZoneId(null);
    setDragStatus({
      draggedFieldId: fieldId,
      overTarget: 'none',
      zoneInsertAfter: null,
    });
  }, []);

  const clearDragState = useCallback(() => {
    setIsDragging(false);
    setDraggedFieldId(null);
    setActiveZoneId(null);
    setDragStatus(EMPTY_DRAG_STATUS);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over ? String(event.over.id) : null;
    const { overTarget, zoneInsertAfter } = classifyDragOverTarget(overId);
    setActiveZoneId(isZoneId(overId ?? '') ? overId : null);
    setDragStatus((prev) => ({
      ...prev,
      overTarget,
      zoneInsertAfter,
    }));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    const zoneHit = pointerCollisions.find((c) => isZoneId(String(c.id)));
    if (zoneHit) return [zoneHit];
    const previewHit = pointerCollisions.find((c) => String(c.id).startsWith('preview:'));
    if (previewHit) return [previewHit];
    return closestCenter(args);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const activeId = String(active.id);
      const overId = over ? String(over.id) : null;

      const activePreview = toPreviewFieldId(activeId);
      const overPreview = overId ? toPreviewFieldId(overId) : null;

      if (
        activePreview &&
        overPreview &&
        activePreview !== overPreview &&
        reorderableFields.includes(activePreview) &&
        reorderableFields.includes(overPreview)
      ) {
        const base = profile.contactDisplayOrder?.length
          ? profile.contactDisplayOrder
          : defaultContactDisplayOrder(reorderableFields);
        applyContactReorder(
          reorderPreviewFields(base, activePreview, overPreview, reorderableFields),
        );
        clearDragState();
        return;
      }

      if (activePreview && overId && isZoneId(overId) && reorderableFields.includes(activePreview)) {
        const insertAfterField = parseZoneInsertAfter(overId);
        const base = profile.contactDisplayOrder?.length
          ? profile.contactDisplayOrder
          : defaultContactDisplayOrder(reorderableFields);
        applyContactReorder(
          reorderContactDisplayOrder(base, activePreview, insertAfterField),
        );
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

        const sidebarPreview = toPreviewFieldId(activeId);
        if (sidebarPreview && overId && isZoneId(overId) && reorderableFields.includes(sidebarPreview)) {
          const insertAfterField = parseZoneInsertAfter(overId);
          const base = profile.contactDisplayOrder?.length
            ? profile.contactDisplayOrder
            : defaultContactDisplayOrder(reorderableFields);
          applyContactReorder(
            reorderContactDisplayOrder(base, activeId, insertAfterField),
          );
          clearDragState();
          return;
        }

        setProfile((p) => reorderDetailAndContact(p, activeId, overId, reorderableFields));
      }

      clearDragState();
    },
    [
      applyContactReorder,
      brandOrder,
      clearDragState,
      profile.contactDisplayOrder,
      reorderableFields,
      setBrandOrder,
      setProfile,
    ],
  );

  const dragStatusMessage = useMemo(() => {
    if (!isDragging) return null;
    return getDragDropStatus({
      dragStatus,
      layout,
      reorderableFields,
    });
  }, [dragStatus, isDragging, layout, reorderableFields]);

  return {
    isDragging,
    draggedFieldId,
    dragStatusMessage,
    activeZoneId,
    reorderableFields,
    sensors,
    collisionDetection,
    handlePreviewDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
