import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildDetailOrderForSidebar } from './fieldOrder';
import { profileAfterContactReorder } from './reorderDragDrop';

describe('fieldOrder template filtering', () => {
  it('buildDetailOrderForSidebar omits phone fields on modern_professional', () => {
    const items = buildDetailOrderForSidebar(undefined, undefined, 'modern_professional');
    assert.ok(items.includes('firstName'));
    assert.ok(items.includes('email'));
    assert.ok(!items.includes('officePhone'));
    assert.ok(!items.includes('mobilePhone'));
  });

  it('buildDetailOrderForSidebar includes phones on stacked layout', () => {
    const items = buildDetailOrderForSidebar(undefined, undefined, 'stacked');
    assert.ok(items.includes('officePhone'));
    assert.ok(items.includes('mobilePhone'));
  });

  it('profileAfterContactReorder syncs detail order for modern_professional', () => {
    const profile = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      title: 'Engineer',
      email: 'ada@example.com',
      contactDisplayOrder: ['logo', 'name', 'title', 'email', 'website'],
      detailOrder: ['avatarUrl', 'firstName', 'lastName', 'title', 'email'],
    };
    const next = profileAfterContactReorder(
      profile,
      ['logo', 'name', 'email', 'title', 'website'],
      ['logo', 'name', 'title', 'email', 'website'],
    );
    assert.deepEqual(next.contactDisplayOrder, ['logo', 'name', 'email', 'title', 'website']);
    const titleIdx = next.detailOrder?.indexOf('title') ?? -1;
    const emailIdx = next.detailOrder?.indexOf('email') ?? -1;
    assert.ok(titleIdx > emailIdx);
  });
});
