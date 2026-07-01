import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fieldLabel,
  getDragDropStatus,
  classifyDragOverTarget,
} from './dragDropStatus';

describe('dragDropStatus', () => {
  it('fieldLabel maps form ids to readable names', () => {
    assert.equal(fieldLabel('avatarUrl'), 'Profile picture');
    assert.equal(fieldLabel('firstName'), 'First name');
    assert.equal(fieldLabel('email'), 'Email');
  });

  it('classifyDragOverTarget detects sidebar and brand fields', () => {
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

  it('getDragDropStatus shows active message when hovering a list row', () => {
    const result = getDragDropStatus({
      dragStatus: {
        draggedFieldId: 'email',
        overTarget: 'sidebar-field',
        zoneInsertAfter: null,
      },
      layout: 'default',
      reorderableFields: ['name', 'title', 'email', 'website'],
    });
    assert.equal(result?.variant, 'active');
    assert.match(result?.message ?? '', /field list/i);
  });

  it('getDragDropStatus points users to the order panel', () => {
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
    assert.match(result?.message ?? '', /field order/i);
  });
});
