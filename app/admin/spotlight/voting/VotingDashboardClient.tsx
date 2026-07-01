'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SpotlightVotingWeekStatus } from '@/models/SpotlightVotingWeek';
import type { VotingWeekGroup } from '@/lib/campaigns/spotlightVotingWeeks';
import { endVotingWeekAction, archiveVotingWeekAction, setVotingWeekStatusAction } from './actions';

const STATUS_LABELS: Record<SpotlightVotingWeekStatus, string> = {
  scheduled: 'Scheduled',
  open: 'Open',
  paused: 'Paused',
  ended: 'Ended',
  archived: 'Archived',
};

const STATUS_BADGE: Record<SpotlightVotingWeekStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  open: 'bg-green-100 text-green-800',
  paused: 'bg-amber-100 text-amber-800',
  ended: 'bg-muted text-muted-foreground',
  archived: 'bg-muted text-muted-foreground',
};

function WeekSection({
  week,
  onRefresh,
}: {
  week: VotingWeekGroup;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function runAction(
    key: string,
    fn: () => Promise<{ success: boolean; message?: string; emailWarnings?: string[] }>,
    confirmText?: string,
  ) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(key);
    setMessage(null);
    try {
      const res = await fn();
      if (!res.success) {
        setMessage(res.message ?? 'Action failed');
        return;
      }
      if (res.emailWarnings?.length) {
        setMessage(`Done with email warnings: ${res.emailWarnings.join('; ')}`);
      }
      onRefresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  }

  const canOpen = week.status === 'scheduled' || week.status === 'paused';
  const canPause = week.status === 'open';
  const canEnd = week.status === 'open' || week.status === 'paused';
  const canArchive = week.status === 'ended';

  return (
    <div className="bg-card border rounded-lg overflow-hidden space-y-0">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b bg-muted/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-lg">{week.label}</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[week.status]}`}>
              {STATUS_LABELS[week.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {week.submissions.length} entrant{week.submissions.length === 1 ? '' : 's'} · {week.totalVotes} total
            votes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canOpen ? (
            <button
              type="button"
              disabled={!!busy || week.submissions.length === 0}
              onClick={() =>
                runAction('open', () => setVotingWeekStatusAction(week.weekStart, 'open'))
              }
              className="text-sm font-medium px-3 py-1.5 rounded-md border bg-background hover:bg-muted disabled:opacity-50"
            >
              {busy === 'open' ? 'Opening…' : 'Open'}
            </button>
          ) : null}
          {canPause ? (
            <button
              type="button"
              disabled={!!busy}
              onClick={() =>
                runAction('pause', () => setVotingWeekStatusAction(week.weekStart, 'paused'))
              }
              className="text-sm font-medium px-3 py-1.5 rounded-md border bg-background hover:bg-muted disabled:opacity-50"
            >
              {busy === 'pause' ? 'Pausing…' : 'Pause'}
            </button>
          ) : null}
          {canEnd ? (
            <button
              type="button"
              disabled={!!busy}
              onClick={() =>
                runAction(
                  'end',
                  () => endVotingWeekAction(week.weekStart),
                  'End voting for this week? The winner will be scheduled for Tuesday and runners-up for Thursday.',
                )
              }
              className="text-sm font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {busy === 'end' ? 'Ending…' : 'End'}
            </button>
          ) : null}
          {canArchive ? (
            <button
              type="button"
              disabled={!!busy}
              onClick={() =>
                runAction(
                  'archive',
                  () => archiveVotingWeekAction(week.weekStart),
                  'Archive this voting week? It will be removed from this list.',
                )
              }
              className="text-sm font-medium px-3 py-1.5 rounded-md border bg-background hover:bg-muted disabled:opacity-50"
            >
              {busy === 'archive' ? 'Archiving…' : 'Archive'}
            </button>
          ) : null}
        </div>
      </div>

      {message ? (
        <p className="text-sm px-4 py-2 bg-amber-50 text-amber-900 border-b border-amber-100">{message}</p>
      ) : null}

      {week.submissions.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">No submissions scheduled for this week.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="p-4 font-medium">Rank</th>
              <th className="p-4 font-medium">Company</th>
              <th className="p-4 font-medium">Founder</th>
              <th className="p-4 font-medium">Votes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {week.submissions.map((sub, idx) => (
              <tr key={sub._id} className={idx === 0 && week.totalVotes > 0 ? 'bg-amber-50/40' : ''}>
                <td className="p-4 font-semibold">{idx + 1}</td>
                <td className="p-4">{sub.companyName}</td>
                <td className="p-4">{sub.founder}</td>
                <td className="p-4 font-bold tabular-nums">{sub.votes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {week.submissions.length === 2 && week.totalVotes > 0 ? (
        <div className="p-4 border-t">
          <div className="flex h-2 rounded-full overflow-hidden bg-muted">
            {week.submissions.map((sub, idx) => {
              const pct = Math.round((sub.votes / week.totalVotes) * 100);
              return (
                <div
                  key={sub._id}
                  className={idx === 0 ? 'bg-primary' : 'bg-primary/40'}
                  style={{ width: `${pct}%` }}
                  title={`${sub.companyName}: ${sub.votes}`}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function VotingDashboardClient({ weeks }: { weeks: VotingWeekGroup[] }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {weeks.map((week) => (
        <WeekSection key={week.weekStart} week={week} onRefresh={() => router.refresh()} />
      ))}
    </div>
  );
}
