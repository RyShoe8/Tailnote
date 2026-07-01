import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fieldLabel,
  getDragDropStatus,
  zonePlacementLabel,
  classifyDragOverTarget,
} from './dragDropStatus';

describe('dragDropStatus', () => {
  it('fieldLabel maps form ids to readable names', () => {
    assert.equal(fieldLabel('avatarUrl'), 'Profile picture');
    assert.equal(fieldLabel('firstName'), 'First name');
    assert.equal(fieldLabel('email'), 'Email');
  });

  it('zonePlacementLabel describes slot position', () => {
    assert.equal(zonePlacementLabel(null), 'at the top');
    assert.equal(zonePlacementLabel('title'), 'below Title');
  });

  it('classifyDragOverTarget detects preview zones and sidebar fields', () => {
    assert.deepEqual(classifyDragOverTarget('zone-0'), {
      overTarget: 'preview-zone',
      zoneInsertAfter: null,
    });
    assert.deepEqual(classifyDragOverTarget('email'), {
      overTarget: 'sidebar-field',
      zoneInsertAfter: null,
    });
    assert.deepEqual(classifyDragOverTarget('companyName'), {
      overTarget: 'brand-field',
      zoneInsertAfter: null,
    });
  });

  it('getDragDropStatus warns for fixed fields', () => {
    const result = getDragDropStatus({
      dragStatus: {
        draggedFieldId: 'avatarUrl',
        overTarget: 'none',
        zoneInsertAfter: null,
      },
      layout: 'modern_professional',
      reorderableFields: ['logo', 'name', 'title', 'email', 'website'],
      isLgUp: true,
      dropZoneCount: 3,
    });
    assert.equal(result?.variant, 'warning');
    assert.match(result?.message ?? '', /fixed in this layout/i);
  });

  it('getDragDropStatus shows active message when hovering a preview zone', () => {
    const result = getDragDropStatus({
      dragStatus: {
        draggedFieldId: 'email',
        overTarget: 'preview-zone',
        zoneInsertAfter: 'title',
      },
      layout: 'default',
      reorderableFields: ['name', 'title', 'email', 'website'],
      isLgUp: true,
      dropZoneCount: 2,
    });
    assert.equal(result?.variant, 'active');
    assert.match(result?.message ?? '', /below Title/i);
  });

  it('getDragDropStatus guides mobile users to sidebar', () => {
    const result = getDragDropStatus({
      dragStatus: {
        draggedFieldId: 'email',
        overTarget: 'none',
        zoneInsertAfter: null,
      },
      layout: 'default',
      reorderableFields: ['name', 'title', 'email'],
      isLgUp: false,
      dropZoneCount: 2,
    });
    assert.equal(result?.variant, 'muted');
    assert.match(result?.message ?? '', /field order/i);
  });

  it('getDragDropStatus shows muted hint when no preview slots', () => {
    const result = getDragDropStatus({
      dragStatus: {
        draggedFieldId: 'email',
        overTarget: 'none',
        zoneInsertAfter: null,
      },
      layout: 'default',
      reorderableFields: ['name', 'title', 'email'],
      isLgUp: true,
      dropZoneCount: 0,
    });
    assert.equal(result?.variant, 'muted');
    assert.match(result?.message ?? '', /name and email/i);
  });
});
