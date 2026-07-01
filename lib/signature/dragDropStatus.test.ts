import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fieldLabel,
  getDragDropStatus,
  classifyDragOverTarget,
  zonePlacementLabel,
} from './dragDropStatus';

describe('dragDropStatus', () => {
  it('fieldLabel maps form ids to readable names', () => {
    assert.equal(fieldLabel('avatarUrl'), 'Profile picture');
    assert.equal(fieldLabel('firstName'), 'First name');
    assert.equal(fieldLabel('email'), 'Email');
    assert.equal(fieldLabel('preview:email'), 'Email');
  });

  it('zonePlacementLabel describes slot position', () => {
    assert.equal(zonePlacementLabel(null), 'at the top');
    assert.equal(zonePlacementLabel('title'), 'below Title');
  });

  it('classifyDragOverTarget detects sidebar, brand, and preview targets', () => {
    assert.deepEqual(classifyDragOverTarget('zone:__start__'), {
      overTarget: 'preview-zone',
      zoneInsertAfter: null,
    });
    assert.deepEqual(classifyDragOverTarget('preview:email'), {
      overTarget: 'preview-field',
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
    });
    assert.equal(result?.variant, 'active');
    assert.match(result?.message ?? '', /below Title/i);
  });

  it('getDragDropStatus guides users to drag on preview or list', () => {
    const result = getDragDropStatus({
      dragStatus: {
        draggedFieldId: 'email',
        overTarget: 'none',
        zoneInsertAfter: null,
      },
      layout: 'default',
      reorderableFields: ['name', 'title', 'email'],
    });
    assert.equal(result?.variant, 'muted');
    assert.match(result?.message ?? '', /live preview/i);
  });
});
