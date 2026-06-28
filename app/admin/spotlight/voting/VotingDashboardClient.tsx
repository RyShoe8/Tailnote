'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveVoteAction } from './actions';

export function VotingDashboardClient({ submissions }: { submissions: any[] }) {
  const router = useRouter();
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    if (!confirm('Are you sure you want to end the voting phase? The winner will be scheduled for next Tuesday, and the runners-up for Thursday.')) return;
    
    setResolving(true);
    try {
      const res = await resolveVoteAction();
      if (res.success) {
        alert('Voting resolved and submissions scheduled!');
        router.refresh();
      } else {
        alert(res.message || 'Failed to resolve vote');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
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
                  {idx === 0 ? '🏆 1st' : `${idx + 1}nd`}
                </td>
                <td className="p-4">{sub.companyName}</td>
                <td className="p-4">{sub.founder}</td>
                <td className="p-4 text-muted-foreground text-xs">
                  {sub.votingStartDate ? new Date(sub.votingStartDate).toLocaleDateString() : 'Immediate'}
                </td>
                <td className="p-4 font-bold text-lg">{sub.votes || 0}</td>
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
