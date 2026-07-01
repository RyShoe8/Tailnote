export const MAX_VOTING_SUBMISSIONS_PER_WEEK = 2;

export type VotingWeekOption = {
  weekStart: Date;
  weekEnd: Date;
  label: string;
};

/** Monday 00:00:00 UTC for the week containing `date`. */
export function getWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart.getTime());
  end.setUTCDate(end.getUTCDate() + 7);
  return end;
}

export function formatVotingWeekLabel(weekStart: Date): string {
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(weekStart);
  return `Week of ${formatted}`;
}

export function getUpcomingVotingWeeks(count = 12, fromDate = new Date()): VotingWeekOption[] {
  const firstWeek = getWeekStart(fromDate);
  const weeks: VotingWeekOption[] = [];

  for (let i = 0; i < count; i++) {
    const weekStart = new Date(firstWeek.getTime());
    weekStart.setUTCDate(weekStart.getUTCDate() + i * 7);
    const weekEnd = getWeekEnd(weekStart);
    weeks.push({
      weekStart,
      weekEnd,
      label: formatVotingWeekLabel(weekStart),
    });
  }

  return weeks;
}

export function formatWeekScheduleCount(count: number): string {
  if (count >= MAX_VOTING_SUBMISSIONS_PER_WEEK) {
    return `${MAX_VOTING_SUBMISSIONS_PER_WEEK} of ${MAX_VOTING_SUBMISSIONS_PER_WEEK} companies scheduled (full)`;
  }
  return `${count} of ${MAX_VOTING_SUBMISSIONS_PER_WEEK} companies scheduled`;
}
