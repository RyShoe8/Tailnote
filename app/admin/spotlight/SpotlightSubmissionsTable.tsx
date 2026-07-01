'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { archiveSubmissionAction } from './submissions/[id]/actions';
import {
  submissionStatusBadgeClass,
  submissionStatusLabel,
} from '@/lib/campaigns/submissionStatusDisplay';
import { formatVotingWeekLabel, getWeekStart } from '@/lib/campaigns/votingWeekUtils';

export type SpotlightSubmissionRow = {
  id: string;
  companyName: string;
  website?: string;
  industry: string;
  status: string;
  votes?: number;
  votingStartDate?: string;
  resubmittedAt?: string;
  createdAt: string;
};

export function SpotlightSubmissionsTable({
  submissions,
  showArchiveAction = true,
}: {
  submissions: SpotlightSubmissionRow[];
  showArchiveAction?: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive(id: string, companyName: string) {
    if (
      !confirm(
        `Archive "${companyName}"? It will be hidden from the main submissions list.`,
      )
    ) {
      return;
    }

    setBusyId(id);
    setError(null);
    try {
      await archiveSubmissionAction(id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive submission');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="mx-4 text-sm rounded-md px-3 py-2 bg-destructive/10 text-destructive">{error}</p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
            <tr>
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Website</th>
              <th className="px-6 py-3">Industry</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Voting week</th>
              <th className="px-6 py-3">Votes</th>
              <th className="px-6 py-3">Date Applied</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                  No submissions found.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub.id} className="border-b hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium">
                    <div className="flex items-center gap-2 flex-wrap">
                      {sub.companyName}
                      {sub.resubmittedAt ? (
                        <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          Updated
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {sub.website ? (
                      <a
                        href={sub.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {sub.website.replace(/^https?:\/\//i, '')}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{sub.industry}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${submissionStatusBadgeClass(sub.status)}`}
                    >
                      {submissionStatusLabel(sub.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {sub.status === 'voting' && sub.votingStartDate
                      ? formatVotingWeekLabel(getWeekStart(new Date(sub.votingStartDate)))
                      : '—'}
                  </td>
                  <td className="px-6 py-4 tabular-nums">
                    {sub.status === 'voting' ? (
                      <span className="font-semibold">{sub.votes ?? 0}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{new Date(sub.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {showArchiveAction && sub.status !== 'archived' ? (
                        <button
                          type="button"
                          onClick={() => handleArchive(sub.id, sub.companyName)}
                          disabled={busyId === sub.id}
                          className="text-muted-foreground hover:text-foreground font-medium text-sm disabled:opacity-50"
                        >
                          {busyId === sub.id ? 'Archiving…' : 'Archive'}
                        </button>
                      ) : null}
                      <Link
                        href={`/admin/spotlight/submissions/${sub.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {sub.status === 'pending' ? 'Review' : 'View'}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
