import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeSpfRecords } from './mergeSpfRecords';

describe('mergeSpfRecords', () => {
  it('merges duplicate includes and prefers -all', () => {
    const merged = mergeSpfRecords([
      'v=spf1 include:_spf.google.com include:spf.brevo.com -all',
      'v=spf1 include:_spf.google.com include:spf.brevo.com ~all',
    ]);
    assert.equal(merged, 'v=spf1 include:_spf.google.com include:spf.brevo.com -all');
  });

  it('unions distinct mechanisms from multiple records', () => {
    const merged = mergeSpfRecords([
      'v=spf1 include:_spf.google.com ~all',
      'v=spf1 include:spf.brevo.com ~all',
    ]);
    assert.ok(merged.includes('include:_spf.google.com'));
    assert.ok(merged.includes('include:spf.brevo.com'));
    assert.ok(merged.endsWith('~all'));
  });
});
