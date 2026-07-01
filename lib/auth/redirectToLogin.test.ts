import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loginRedirectPath } from './redirectToLogin';

describe('loginRedirectPath', () => {
  it('includes encoded next for allowed dashboard paths', () => {
    const path = loginRedirectPath('/dashboard/spotlight/apply');
    assert.ok(path.startsWith('/login?next='));
    assert.ok(path.includes(encodeURIComponent('/dashboard/spotlight/apply')));
  });

  it('returns bare login for external or disallowed paths', () => {
    assert.equal(loginRedirectPath('https://evil.com'), '/login');
    assert.equal(loginRedirectPath('/login'), '/login');
    assert.equal(loginRedirectPath(null), '/login');
  });
});
