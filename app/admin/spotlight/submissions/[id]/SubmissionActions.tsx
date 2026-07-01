'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  deleteSubmissionAction,
  getVotingWeekOptionsAction,
  toggleHallOfFameAction,
  updateSubmissionStatusAction,
  type VotingWeekOptionDto,
} from './actions';
import {
  MAX_VOTING_SUBMISSIONS_PER_WEEK,
  formatWeekScheduleCount,
} from '@/lib/campaigns/votingWeekUtils';
import { canManageHallOfFame } from '@/lib/campaigns/hallOfFame';

type NotesMode = 'needs_changes' | 'rejected' | null;

export function SubmissionActions({
  submissionId,
  hallOfFame,
  isVoteWinner,
}: {
  submissionId: string;
  hallOfFame?: boolean;
  isVoteWinner?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [weekOptions, setWeekOptions] = useState<VotingWeekOptionDto[]>([]);
  const [weeksLoading, setWeeksLoading] = useState(true);
  const [selectedWeekStart, setSelectedWeekStart] = useState('');
  const [notesMode, setNotesMode] = useState<NotesMode>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadWeeks() {
      try {
        const options = await getVotingWeekOptionsAction(submissionId);
        if (cancelled) return;
        setWeekOptions(options);
        if (options.length > 0) {
          const firstAvailable =
            options.find((o) => o.scheduledCount < MAX_VOTING_SUBMISSIONS_PER_WEEK) ?? options[0];
          setSelectedWeekStart(firstAvailable.weekStart);
        }
      } catch {
        if (!cancelled) {
          setMessage('Failed to load voting weeks.');
          setMessageIsError(true);
        }
      } finally {
        if (!cancelled) setWeeksLoading(false);
      }
    }

    loadWeeks();
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const selectedWeek = weekOptions.find((w) => w.weekStart === selectedWeekStart);
  const selectedWeekFull =
    (selectedWeek?.scheduledCount ?? 0) >= MAX_VOTING_SUBMISSIONS_PER_WEEK;
  const showHallOfFame = canManageHallOfFame({ hallOfFame, isVoteWinner });

  function showError(err: unknown, fallback: string) {
    const text = err instanceof Error ? err.message : fallback;
    setMessage(text);
    setMessageIsError(true);
  }

  function showSuccess(text: string) {
    setMessage(text);
    setMessageIsError(false);
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this submission? This cannot be undone.')) return;

    try {
      await deleteSubmissionAction(submissionId);
      router.push('/admin/spotlight');
    } catch {
      showError(null, 'Failed to delete submission');
    }
  }

  async function handleScheduleVoting() {
    if (!selectedWeekStart) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const result = await updateSubmissionStatusAction(submissionId, 'voting', {
        votingStartDate: new Date(selectedWeekStart),
      });
      showSuccess(
        result.emailWarning
          ? `Submission scheduled for voting. ${result.emailWarning}`
          : 'Submission scheduled for voting.',
      );
      router.refresh();
    } catch (err) {
      showError(err, 'Failed to schedule voting');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusUpdate(status: string, notes?: string) {
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await updateSubmissionStatusAction(submissionId, status, {
        reviewerNotes: notes,
      });
      setNotesMode(null);
      setReviewerNotes('');
      const labels: Record<string, string> = {
        needs_changes: 'Change request sent to applicant.',
        rejected: 'Submission rejected.',
      };
      const base = labels[status] ?? 'Status updated.';
      showSuccess(result.emailWarning ? `${base} ${result.emailWarning}` : base);
      router.refresh();
    } catch (err) {
      showError(err, 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleHallOfFame() {
    try {
      const result = await toggleHallOfFameAction(submissionId);
      if (result.emailWarning) {
        showSuccess(result.emailWarning);
      }
      router.refresh();
    } catch (err) {
      showError(err, 'Failed to toggle Hall of Fame status');
    }
  }

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <h2 className="font-semibold text-lg border-b pb-2">Admin Actions</h2>

      {message ? (
        <p
          className={`text-sm rounded-md px-3 py-2 ${
            messageIsError ? 'bg-destructive/10 text-destructive' : 'bg-green-50 text-green-800'
          }`}
        >
          {message}
        </p>
      ) : null}

      <div className="space-y-3">
        <div className="p-3 border rounded-md bg-muted/30 space-y-2">
          <label htmlFor="votingWeek" className="text-sm font-medium">
            Voting week
          </label>
          <select
            id="votingWeek"
            className="w-full border rounded px-2 py-1.5 text-sm bg-background"
            value={selectedWeekStart}
            onChange={(e) => setSelectedWeekStart(e.target.value)}
            disabled={weeksLoading || weekOptions.length === 0}
          >
            {weeksLoading ? <option>Loading weeks…</option> : null}
            {!weeksLoading && weekOptions.length === 0 ? (
              <option value="">No weeks available</option>
            ) : null}
            {weekOptions.map((week) => (
              <option key={week.weekStart} value={week.weekStart}>
                {week.label}
              </option>
            ))}
          </select>
          {selectedWeek ? (
            <p className="text-xs text-muted-foreground">
              {formatWeekScheduleCount(selectedWeek.scheduledCount)}
            </p>
          ) : null}
          <button
            onClick={handleScheduleVoting}
            disabled={submitting || weeksLoading || !selectedWeekStart || selectedWeekFull}
            className="w-full bg-blue-600 text-white py-1.5 px-4 rounded-md font-medium text-sm hover:bg-blue-700 transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Scheduled Vote
          </button>
        </div>

        {notesMode === 'needs_changes' ? (
          <div className="p-3 border rounded-md space-y-2">
            <label htmlFor="needsChangesNotes" className="text-sm font-medium">
              What should they change?
            </label>
            <textarea
              id="needsChangesNotes"
              className="w-full border rounded px-2 py-1.5 text-sm min-h-[100px]"
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Describe the changes needed before this can be approved…"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusUpdate('needs_changes', reviewerNotes)}
                disabled={submitting || !reviewerNotes.trim()}
                className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-md font-medium hover:bg-secondary/80 transition disabled:opacity-50"
              >
                Send change request
              </button>
              <button
                onClick={() => {
                  setNotesMode(null);
                  setReviewerNotes('');
                }}
                className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setNotesMode('needs_changes')}
            disabled={submitting}
            className="w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-md font-medium hover:bg-secondary/80 transition disabled:opacity-50"
          >
            Request Changes
          </button>
        )}

        {notesMode === 'rejected' ? (
          <div className="p-3 border rounded-md space-y-2 border-destructive/30">
            <label htmlFor="rejectNotes" className="text-sm font-medium">
              Rejection notes (optional)
            </label>
            <textarea
              id="rejectNotes"
              className="w-full border rounded px-2 py-1.5 text-sm min-h-[80px]"
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Optional feedback for the applicant…"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusUpdate('rejected', reviewerNotes)}
                disabled={submitting}
                className="flex-1 bg-destructive text-destructive-foreground py-2 px-4 rounded-md font-medium hover:bg-destructive/90 transition disabled:opacity-50"
              >
                Confirm rejection
              </button>
              <button
                onClick={() => {
                  setNotesMode(null);
                  setReviewerNotes('');
                }}
                className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setNotesMode('rejected');
              setReviewerNotes('');
            }}
            disabled={submitting || notesMode === 'needs_changes'}
            className="w-full bg-destructive text-destructive-foreground py-2 px-4 rounded-md font-medium hover:bg-destructive/90 transition disabled:opacity-50"
          >
            Reject Submission
          </button>
        )}
      </div>

      {showHallOfFame ? (
        <div className="pt-4 border-t mt-4 space-y-3">
          <h3 className="font-semibold text-sm">Hall of Fame</h3>
          <p className="text-xs text-muted-foreground">
            Feature this submission on the public Spotlight winners page.
          </p>
          <button
            onClick={handleToggleHallOfFame}
            className={`w-full py-2 px-4 rounded-md font-medium transition ${
              hallOfFame
                ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                : 'border border-input bg-background hover:bg-accent'
            }`}
          >
            {hallOfFame ? '★ Remove from Hall of Fame' : '☆ Add to Hall of Fame'}
          </button>
        </div>
      ) : (
        <div className="pt-4 border-t mt-4 space-y-2">
          <h3 className="font-semibold text-sm">Hall of Fame</h3>
          <p className="text-xs text-muted-foreground">
            Hall of Fame is available after winning the community vote.
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-destructive/20 mt-4 space-y-3">
        <p className="text-xs text-muted-foreground">Destructive actions:</p>
        <button
          onClick={handleDelete}
          className="w-full border border-destructive text-destructive py-2 px-4 rounded-md font-medium hover:bg-destructive/10 transition"
        >
          Delete Submission
        </button>
      </div>
    </div>
  );
}
