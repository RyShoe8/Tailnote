import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildJoinAcceptLoginRedirect,
  buildJoinAcceptSignupRedirect,
  evaluateJoinInvitePrecheck,
} from './joinInviteAccept';

describe('join invite accept helpers', () => {
  it('builds signup redirect with encoded params', () => {
    const redirect = buildJoinAcceptSignupRedirect('abc123', 'user+test@example.com');
    assert.equal(
      redirect,
      '/signup?join=abc123&email=user%2Btest%40example.com'
    );
  });

  it('builds login redirect with encoded params', () => {
    const redirect = buildJoinAcceptLoginRedirect('abc123', 'user+test@example.com');
    assert.equal(redirect, '/login?join=abc123&email=user%2Btest%40example.com');
  });

  it('returns expired invite error', () => {
    assert.deepEqual(
      evaluateJoinInvitePrecheck({
        email: 'user@example.com',
        expired: true,
        alreadyAccepted: false,
      }),
      { status: 410, error: 'This invitation has expired' }
    );
  });

  it('returns already accepted error', () => {
    assert.deepEqual(
      evaluateJoinInvitePrecheck({
        email: 'user@example.com',
        expired: false,
        alreadyAccepted: true,
      }),
      { status: 400, error: 'This invitation has already been accepted' }
    );
  });

  it('returns null for valid pending invite', () => {
    assert.equal(
      evaluateJoinInvitePrecheck({
        email: 'user@example.com',
        expired: false,
        alreadyAccepted: false,
      }),
      null
    );
  });
});
