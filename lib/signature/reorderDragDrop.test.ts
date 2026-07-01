import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SignatureProfile } from 'emailsignature-engine';
import {
  reorderContactDisplayOrder,
  reorderDetailAndContact,
  reorderBrandOrder,
} from './reorderDragDrop';

const baseProfile: SignatureProfile = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  title: 'Engineer',
  email: 'ada@example.com',
  officePhone: '',
  mobilePhone: '',
  detailOrder: ['firstName', 'lastName', 'title', 'email', 'officePhone', 'mobilePhone'],
  contactDisplayOrder: ['name', 'title', 'email', 'website'],
};

describe('reorderDragDrop', () => {
  it('reorderContactDisplayOrder inserts after a field', () => {
    const next = reorderContactDisplayOrder(
      ['name', 'title', 'email', 'website'],
      'website',
      'name',
    );
    assert.deepEqual(next, ['name', 'website', 'title', 'email']);
  });

  it('reorderContactDisplayOrder inserts at top', () => {
    const next = reorderContactDisplayOrder(['name', 'title', 'email'], 'email', null);
    assert.equal(next[0], 'email');
  });

  it('reorderDetailAndContact syncs sidebar and preview order', () => {
    const reorderable = ['name', 'title', 'email', 'website', 'officePhone', 'mobilePhone'] as const;
    const next = reorderDetailAndContact(baseProfile, 'email', 'title', reorderable);
    assert.ok((next.detailOrder?.indexOf('email') ?? 0) < (next.detailOrder?.indexOf('title') ?? 0));
    assert.ok(
      (next.contactDisplayOrder?.indexOf('email') ?? 0) <
        (next.contactDisplayOrder?.indexOf('title') ?? 0),
    );
  });

  it('reorderBrandOrder moves brand fields', () => {
    const next = reorderBrandOrder([], 'website', 'companyName', ['companyName', 'website']);
    assert.deepEqual(next, ['website', 'companyName']);
  });
});
