import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canAddToHallOfFame, canManageHallOfFame } from './hallOfFame';

describe('hallOfFame', () => {
  it('allows management for vote winners', () => {
    assert.equal(canManageHallOfFame({ isVoteWinner: true, hallOfFame: false }), true);
    assert.equal(canAddToHallOfFame({ isVoteWinner: true, hallOfFame: false }), true);
  });

  it('allows management when already inducted', () => {
    assert.equal(canManageHallOfFame({ isVoteWinner: false, hallOfFame: true }), true);
    assert.equal(canAddToHallOfFame({ isVoteWinner: false, hallOfFame: true }), false);
  });

  it('blocks hall of fame before winning', () => {
    assert.equal(canManageHallOfFame({ isVoteWinner: false, hallOfFame: false }), false);
    assert.equal(canAddToHallOfFame({ isVoteWinner: false, hallOfFame: false }), false);
  });
});
