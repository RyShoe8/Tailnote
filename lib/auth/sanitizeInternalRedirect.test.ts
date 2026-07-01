import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitizeInternalRedirect } from './sanitizeInternalRedirect';

describe('sanitizeInternalRedirect', () => {
  it('accepts dashboard paths', () => {
    assert.equal(
      sanitizeInternalRedirect('/dashboard/spotlight/apply'),
      '/dashboard/spotlight/apply',
    );
  });

  it('accepts paths with query strings', () => {
    assert.equal(sanitizeInternalRedirect('/dashboard?checkout=success'), '/dashboard?checkout=success');
  });

  it('rejects external URLs', () => {
    assert.equal(sanitizeInternalRedirect('https://evil.com'), null);
    assert.equal(sanitizeInternalRedirect('//evil.com'), null);
  });

  it('rejects paths outside allowlist', () => {
    assert.equal(sanitizeInternalRedirect('/login'), null);
    assert.equal(sanitizeInternalRedirect('/api/admin'), null);
  });

  it('rejects backslashes and empty values', () => {
    assert.equal(sanitizeInternalRedirect('/dashboard\\evil'), null);
    assert.equal(sanitizeInternalRedirect(''), null);
    assert.equal(sanitizeInternalRedirect(null), null);
  });
});
