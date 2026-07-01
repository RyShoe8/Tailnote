'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
import { applyBrandFieldsToContactOrder } from '@/lib/signature/fieldOrder';
import {
  defaultContactDisplayOrder,
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

  const reorderableFields = useMemo(
    () => getLayoutReorderRules(layout).reorderableFields,
    [layout],
  );

  const handlePreviewDragStart = useCallback((event: DragStartEvent) => {
    const fieldId = String(event.active.id);
    setIsDragging(true);
    setDraggedFieldId(fieldId);
    setDragStatus({
      draggedFieldId: fieldId,
      overTarget: 'none',
      zoneInsertAfter: null,
    });
  }, []);

  const clearDragState = useCallback(() => {
    setIsDragging(false);
    setDraggedFieldId(null);
    setDragStatus(EMPTY_DRAG_STATUS);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over ? String(event.over.id) : null;
    const { overTarget } = classifyDragOverTarget(overId);
    setDragStatus((prev) => ({
      ...prev,
      overTarget,
      zoneInsertAfter: null,
    }));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const activeId = String(active.id);
      const overId = over ? String(over.id) : null;

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
      }

      clearDragState();
    },
    [brandOrder, clearDragState, reorderableFields, setBrandOrder, setProfile],
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
    reorderableFields,
    sensors,
    collisionDetection: closestCenter,
    handlePreviewDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
