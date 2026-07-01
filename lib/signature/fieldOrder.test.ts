import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deriveContactOrderFromDetailOrder,
  syncDetailOrderFromContact,
  fromSigOrderId,
  toSigOrderId,
  reorderPreviewFields,
  applyBrandFieldsToContactOrder,
} from './fieldOrder';

describe('fieldOrder', () => {
  it('maps sig-order ids', () => {
    assert.equal(toSigOrderId('email'), 'sig-order:email');
    assert.equal(fromSigOrderId('sig-order:email'), 'email');
    assert.equal(fromSigOrderId('email'), null);
  });

  it('deriveContactOrderFromDetailOrder follows sidebar sequence', () => {
    const reorderable = ['name', 'title', 'email', 'website'] as const;
    const detail = ['avatarUrl', 'firstName', 'lastName', 'email', 'title'];
    const next = deriveContactOrderFromDetailOrder(
      detail,
      reorderable,
      ['name', 'title', 'email', 'website'],
    );
    assert.ok(next.indexOf('email') < next.indexOf('title'));
    assert.ok(next.indexOf('name') < next.indexOf('email'));
  });

  it('syncDetailOrderFromContact mirrors preview order in sidebar', () => {
    const reorderable = ['name', 'title', 'email', 'website'] as const;
    const detail = ['avatarUrl', 'firstName', 'lastName', 'title', 'email'];
    const next = syncDetailOrderFromContact(
      detail,
      ['name', 'email', 'title', 'website'],
      reorderable,
    );
    assert.ok(next.indexOf('email') < next.indexOf('title'));
    assert.ok(next.indexOf('firstName') < next.indexOf('lastName'));
  });

  it('reorderPreviewFields swaps preview ids', () => {
    const next = reorderPreviewFields(
      ['name', 'title', 'email'],
      'email',
      'name',
      ['name', 'title', 'email'],
    );
    assert.deepEqual(next, ['email', 'name', 'title']);
  });

  it('applyBrandFieldsToContactOrder swaps company and website', () => {
    const next = applyBrandFieldsToContactOrder(
      ['name', 'title', 'companyName', 'email', 'website'],
      ['website', 'companyName'],
      ['name', 'title', 'companyName', 'email', 'website'],
    );
    assert.ok(next.indexOf('website') < next.indexOf('companyName'));
  });
});
