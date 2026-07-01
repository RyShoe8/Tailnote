import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPostSignupPath } from './buildPostSignupPath';

describe('buildPostSignupPath', () => {
  it('routes spotlight redirect through onboarding', () => {
    const params = new URLSearchParams('redirect=/dashboard/spotlight/apply');
    assert.equal(
      buildPostSignupPath({ searchParams: params, inviteToken: null, joinToken: null }),
      '/onboarding?redirect=%2Fdashboard%2Fspotlight%2Fapply',
    );
  });

  it('prioritizes join token over redirect', () => {
    const params = new URLSearchParams('redirect=/dashboard/spotlight/apply');
    assert.equal(
      buildPostSignupPath({ searchParams: params, inviteToken: null, joinToken: 'abc' }),
      '/join/abc?accept=1',
    );
  });

  it('defaults to onboarding without redirect', () => {
    assert.equal(
      buildPostSignupPath({ searchParams: new URLSearchParams(), inviteToken: null, joinToken: null }),
      '/onboarding',
    );
  });
});
