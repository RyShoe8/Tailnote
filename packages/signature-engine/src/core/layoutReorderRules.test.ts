import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getLayoutReorderRules,
  resolveFieldOrder,
  isFieldReorderable,
  formFieldToPreviewField,
} from './layoutReorderRules';

describe('layoutReorderRules', () => {
  it('returns default rules for standard layout', () => {
    const rules = getLayoutReorderRules('standard');
    assert.ok(rules.reorderableFields.includes('name'));
    assert.ok(rules.reorderableFields.includes('email'));
    assert.ok(rules.fixedFields.includes('logo'));
  });

  it('resolveFieldOrder merges saved order with template defaults', () => {
    const rules = getLayoutReorderRules('default');
    const order = resolveFieldOrder(rules, ['website', 'email', 'name']);
    assert.ok(order.indexOf('website') < order.indexOf('email'));
    assert.ok(order.indexOf('email') < order.indexOf('name'));
    assert.ok(order.includes('title'));
    assert.ok(order.includes('officePhone'));
  });

  it('resolveFieldOrder ignores fields not allowed by layout', () => {
    const rules = getLayoutReorderRules('modern_professional');
    const order = resolveFieldOrder(rules, ['avatar', 'email', 'logo']);
    assert.ok(!order.includes('avatar'));
    assert.equal(order[0], 'email');
    assert.ok(order.includes('logo'));
  });

  it('isFieldReorderable respects layout rules', () => {
    const rules = getLayoutReorderRules('modern_professional');
    assert.equal(isFieldReorderable(rules, 'avatar'), false);
    assert.equal(isFieldReorderable(rules, 'email'), true);
  });

  it('maps form field ids to preview field ids', () => {
    assert.equal(formFieldToPreviewField('firstName'), 'name');
    assert.equal(formFieldToPreviewField('avatarUrl'), 'avatar');
    assert.equal(formFieldToPreviewField('logoUrl'), 'logo');
  });
});
