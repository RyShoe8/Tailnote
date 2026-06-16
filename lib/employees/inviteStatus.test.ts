import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getEmployeeInviteStatus, inviteStatusLabel } from './inviteStatus';
import { isInviteExpired } from './inviteToken';

describe('employee invite status', () => {
  it('treats linked userId as active', () => {
    assert.equal(
      getEmployeeInviteStatus({ userId: 'user-1', inviteSentAt: null }),
      'active'
    );
  });

  it('shows expired for pending invites without expiry', () => {
    assert.equal(
      getEmployeeInviteStatus({
        inviteSentAt: '2024-01-01T00:00:00.000Z',
        inviteExpiresAt: null,
      }),
      'expired'
    );
  });

  it('shows expired for past expiry dates', () => {
    assert.equal(
      getEmployeeInviteStatus({
        inviteSentAt: '2024-01-01T00:00:00.000Z',
        inviteExpiresAt: '2024-01-02T00:00:00.000Z',
      }),
      'expired'
    );
  });

  it('shows pending for future expiry', () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(
      getEmployeeInviteStatus({
        inviteSentAt: new Date().toISOString(),
        inviteExpiresAt: future,
      }),
      'pending'
    );
  });

  it('labels active and expired states', () => {
    assert.equal(inviteStatusLabel('active'), 'Active');
    assert.equal(inviteStatusLabel('expired'), 'Expired');
  });
});

describe('invite expiry helper', () => {
  it('treats missing expiry as expired', () => {
    assert.equal(isInviteExpired(null), true);
    assert.equal(isInviteExpired(undefined), true);
  });
});
