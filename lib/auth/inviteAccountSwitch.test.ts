import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildInviteLoginUrl,
  buildInviteSignupUrl,
  normalizeEmailForCompare,
  sessionMatchesInvitedEmail,
} from './inviteAccountSwitch';

describe('invite account switch helpers', () => {
  it('builds invite signup and login URLs', () => {
    assert.equal(
      buildInviteSignupUrl('tok', 'a@b.com'),
      '/signup?join=tok&email=a%40b.com'
    );
    assert.equal(buildInviteLoginUrl('tok', 'a@b.com'), '/login?join=tok&email=a%40b.com');
  });

  it('normalizes emails for comparison', () => {
    assert.equal(normalizeEmailForCompare('  User@Example.COM '), 'user@example.com');
  });

  it('matches session email to invited email case-insensitively', () => {
    assert.equal(sessionMatchesInvitedEmail('User@Example.com', 'user@example.com'), true);
    assert.equal(sessionMatchesInvitedEmail('other@example.com', 'user@example.com'), false);
    assert.equal(sessionMatchesInvitedEmail(null, 'user@example.com'), false);
  });
});
