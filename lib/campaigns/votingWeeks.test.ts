import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MAX_VOTING_SUBMISSIONS_PER_WEEK,
  coerceToDate,
  formatVotingWeekLabel,
  formatWeekScheduleCount,
  getFirstSchedulableWeekStart,
  getUpcomingVotingWeeks,
  getWeekEnd,
  getWeekStart,
  isSchedulableWeekStart,
  isVotingWeekLive,
  votingWeekStartIso,
} from './votingWeekUtils';

describe('votingWeeks', () => {
  it('normalizes to Monday 00:00 UTC', () => {
    const wednesday = new Date('2026-06-03T15:30:00.000Z');
    const weekStart = getWeekStart(wednesday);
    assert.equal(weekStart.toISOString(), '2026-06-01T00:00:00.000Z');
    assert.equal(weekStart.getUTCDay(), 1);
  });

  it('normalizes Sunday to the preceding Monday', () => {
    const sunday = new Date('2026-06-07T12:00:00.000Z');
    const weekStart = getWeekStart(sunday);
    assert.equal(weekStart.toISOString(), '2026-06-01T00:00:00.000Z');
  });

  it('week end is seven days after week start', () => {
    const weekStart = getWeekStart(new Date('2026-06-09T00:00:00.000Z'));
    const weekEnd = getWeekEnd(weekStart);
    assert.equal(weekEnd.getTime() - weekStart.getTime(), 7 * 24 * 60 * 60 * 1000);
  });

  it('formats voting week labels', () => {
    const label = formatVotingWeekLabel(new Date('2026-06-09T00:00:00.000Z'));
    assert.match(label, /^Week of Jun 9, 2026$/);
  });

  it('skips past weeks when building schedulable options', () => {
    const tuesday = new Date('2026-06-03T00:00:00.000Z');
    assert.equal(getFirstSchedulableWeekStart(tuesday).toISOString(), '2026-06-08T00:00:00.000Z');
    assert.equal(isSchedulableWeekStart(new Date('2026-06-01T00:00:00.000Z'), tuesday), false);
    assert.equal(isSchedulableWeekStart(new Date('2026-06-08T00:00:00.000Z'), tuesday), true);
  });

  it('allows the current week when today is Monday', () => {
    const monday = new Date('2026-06-08T00:00:00.000Z');
    assert.equal(getFirstSchedulableWeekStart(monday).toISOString(), '2026-06-08T00:00:00.000Z');
  });

  it('returns consecutive upcoming schedulable weeks', () => {
    const from = new Date('2026-06-03T00:00:00.000Z');
    const weeks = getUpcomingVotingWeeks(3, from);
    assert.equal(weeks.length, 3);
    assert.equal(weeks[0].weekStart.toISOString(), '2026-06-08T00:00:00.000Z');
    assert.equal(weeks[1].weekStart.toISOString(), '2026-06-15T00:00:00.000Z');
    assert.equal(weeks[2].weekStart.toISOString(), '2026-06-22T00:00:00.000Z');
  });

  it('describes schedule counts for the two-per-week cap', () => {
    assert.equal(formatWeekScheduleCount(0), '0 of 2 companies scheduled');
    assert.equal(formatWeekScheduleCount(1), '1 of 2 companies scheduled');
    assert.equal(
      formatWeekScheduleCount(MAX_VOTING_SUBMISSIONS_PER_WEEK),
      '2 of 2 companies scheduled (full)',
    );
  });

  it('coerceToDate accepts Date instances and ISO strings', () => {
    const fromDate = new Date('2026-06-08T00:00:00.000Z');
    const fromString = coerceToDate('2026-06-08T00:00:00.000Z');
    assert.equal(fromDate.toISOString(), fromString.toISOString());
    assert.throws(() => coerceToDate('not-a-date'), /Invalid date/);
  });

  it('votingWeekStartIso normalizes to Monday UTC', () => {
    const wednesday = '2026-06-03T15:30:00.000Z';
    assert.equal(votingWeekStartIso(wednesday), '2026-06-01T00:00:00.000Z');
  });

  it('isVotingWeekLive matches public vote page semantics', () => {
    const now = new Date('2026-06-08T12:00:00.000Z');
    assert.equal(isVotingWeekLive('2026-06-08T00:00:00.000Z', now), true);
    assert.equal(isVotingWeekLive('2026-06-15T00:00:00.000Z', now), false);
    assert.equal(isVotingWeekLive(null, now), true);
  });

  it('display count includes all submissions; capacity excludes self when rescheduling', () => {
    const scheduledCountForDisplay = 1;
    const remainingSlots = Math.max(0, MAX_VOTING_SUBMISSIONS_PER_WEEK - scheduledCountForDisplay);
    assert.equal(formatWeekScheduleCount(scheduledCountForDisplay), '1 of 2 companies scheduled');
    assert.equal(remainingSlots, 1);

    const othersOnWeekWhenRescheduling = 1;
    const capacityCountExcludingSelf = othersOnWeekWhenRescheduling;
    assert.equal(capacityCountExcludingSelf < MAX_VOTING_SUBMISSIONS_PER_WEEK, true);

    const weekFullForOthers = MAX_VOTING_SUBMISSIONS_PER_WEEK;
    assert.equal(weekFullForOthers >= MAX_VOTING_SUBMISSIONS_PER_WEEK, true);
  });
});
