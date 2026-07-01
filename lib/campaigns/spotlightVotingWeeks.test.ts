import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getNextCalendarWeekStart,
  voteCookieNameForWeek,
} from './spotlightVotingWeeks';
import { getWeekStart, votingWeekStartIso } from './votingWeekUtils';

describe('spotlightVotingWeeks', () => {
  it('voteCookieNameForWeek is unique per week', () => {
    const a = voteCookieNameForWeek('2026-06-08T00:00:00.000Z');
    const b = voteCookieNameForWeek('2026-06-15T00:00:00.000Z');
    assert.notEqual(a, b);
    assert.ok(a.startsWith('has_voted_spotlight_'));
  });

  it('getNextCalendarWeekStart is seven days after current week', () => {
    const from = new Date('2026-06-03T12:00:00.000Z');
    const next = getNextCalendarWeekStart(from);
    assert.equal(votingWeekStartIso(next), '2026-06-08T00:00:00.000Z');
    assert.equal(
      next.getTime() - getWeekStart(from).getTime(),
      7 * 24 * 60 * 60 * 1000,
    );
  });
});
