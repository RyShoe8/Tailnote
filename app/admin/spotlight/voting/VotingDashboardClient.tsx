'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveVoteAction } from './actions';

export function VotingDashboardClient({ submissions }: { submissions: any[] }) {
  const router = useRouter();
  const [resolving, setResolving] = useState(false);
  const totalVotes = submissions.reduce((sum, sub) => sum + (sub.votes ?? 0), 0);

  const handleResolve = async () => {
    if (!confirm('Are you sure you want to end the voting phase? The winner will be scheduled for next Tuesday, and the runners-up for Thursday.')) return;

    setResolving(true);
    try {
      const res = await resolveVoteAction();
      if (res.success) {
        const warning =
          'emailWarnings' in res && Array.isArray(res.emailWarnings) && res.emailWarnings.length > 0
            ? `\n\nEmail warnings:\n${res.emailWarnings.join('\n')}`
            : '';
        alert(`Voting resolved and submissions scheduled!${warning}`);
        router.refresh();
      } else {
        alert(res.message || 'Failed to resolve vote');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {submissions.length === 2 && totalVotes > 0 ? (
        <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-medium">{totalVotes} total votes</p>
          <div className="flex h-3 rounded-full overflow-hidden bg-muted">
            {submissions.map((sub, idx) => {
              const votes = sub.votes ?? 0;
              const pct = Math.round((votes / totalVotes) * 100);
              return (
                <div
                  key={sub._id}
                  className={idx === 0 ? 'bg-primary' : 'bg-primary/40'}
                  style={{ width: `${pct}%` }}
                  title={`${sub.companyName}: ${votes} (${pct}%)`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {submissions.map((sub) => {
              const votes = sub.votes ?? 0;
              const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              return (
                <span key={sub._id}>
                  {sub.companyName}: {votes} ({pct}%)
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-4 font-medium">Rank</th>
              <th className="p-4 font-medium">Company</th>
              <th className="p-4 font-medium">Founder</th>
              <th className="p-4 font-medium">Start Date</th>
              <th className="p-4 font-medium">Votes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {submissions.map((sub, idx) => (
              <tr key={sub._id} className={idx === 0 ? 'bg-amber-50/50' : ''}>
                <td className="p-4 font-semibold">
                  {idx === 0 ? '1st' : '2nd'}
                </td>
                <td className="p-4">{sub.companyName}</td>
                <td className="p-4">{sub.founder}</td>
                <td className="p-4 text-muted-foreground text-xs">
                  {sub.votingStartDate ? new Date(sub.votingStartDate).toLocaleDateString() : 'Immediate'}
                </td>
                <td className="p-4 font-bold text-lg tabular-nums">{sub.votes || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleResolve}
          disabled={resolving}
          className="bg-primary text-primary-foreground font-medium px-6 py-2 rounded-md hover:bg-primary/90 transition disabled:opacity-50"
        >
          {resolving ? 'Resolving...' : 'End Vote & Schedule Posts'}
        </button>
      </div>
    </div>
  );
}
