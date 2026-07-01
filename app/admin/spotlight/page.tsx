import Link from 'next/link';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { CampaignScheduleModel } from '@/models/CampaignSchedule';
import { getOpenVotingWeekSubmissions } from '@/lib/campaigns/spotlightVotingWeeks';
import type { SpotlightVotingWeekStatus } from '@/models/SpotlightVotingWeek';
import {
  formatVotingWeekLabel,
  getWeekStart,
} from '@/lib/campaigns/votingWeekUtils';
import { SpotlightSubmissionsTable, type SpotlightSubmissionRow } from './SpotlightSubmissionsTable';

function weekStatusLabel(status: SpotlightVotingWeekStatus | null): string {
  if (status === 'open') return 'Live vote';
  if (status === 'paused') return 'Voting paused';
  if (status === 'scheduled') return 'Scheduled for voting';
  if (status === 'ended') return 'Ended';
  return 'Scheduled for voting';
}

function weekStatusBadgeClass(status: SpotlightVotingWeekStatus | null): string {
  if (status === 'open') return 'text-green-800 bg-green-100';
  if (status === 'paused') return 'text-amber-800 bg-amber-100';
  if (status === 'ended') return 'text-muted-foreground bg-muted';
  return 'text-blue-800 bg-blue-100';
}

function ActiveVoteCard({
  submissions,
  weekLabel,
  weekStatus,
}: {
  submissions: Array<{
    _id: { toString(): string };
    companyName: string;
    founder: string;
    votes?: number;
    votingStartDate?: Date | string;
  }>;
  weekLabel?: string | null;
  weekStatus?: SpotlightVotingWeekStatus | null;
}) {
  const totalVotes = submissions.reduce((sum, s) => sum + (s.votes ?? 0), 0);
  const leaderVotes = submissions[0]?.votes ?? 0;

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg">Active community vote</h2>
          <p className="text-sm text-muted-foreground">
            {weekLabel ? `${weekLabel} · ` : ''}
            {submissions.length === 2
              ? `${totalVotes} total vote${totalVotes === 1 ? '' : 's'} cast`
              : submissions.length === 1
                ? 'Waiting for a second entrant this week'
                : 'No open voting week — open a week from the voting dashboard'}
          </p>
        </div>
        <Link
          href="/admin/spotlight/voting"
          className="text-sm text-primary hover:underline font-medium shrink-0"
        >
          Manage vote →
        </Link>
      </div>

      {submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Schedule submissions for a voting week to start collecting votes.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {submissions.map((sub, idx) => {
            const votes = sub.votes ?? 0;
            const isLeader = submissions.length === 2 && votes === leaderVotes && votes > 0 && idx === 0;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const weekLabelEntry = sub.votingStartDate
              ? formatVotingWeekLabel(getWeekStart(new Date(sub.votingStartDate)))
              : null;
            return (
              <div
                key={sub._id.toString()}
                className={`rounded-lg border p-4 space-y-2 ${
                  isLeader ? 'border-amber-300 bg-amber-50/50' : 'bg-muted/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{sub.companyName}</p>
                    <p className="text-sm text-muted-foreground">{sub.founder}</p>
                    {weekLabelEntry ? (
                      <p className="text-xs text-muted-foreground mt-1">{weekLabelEntry}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isLeader ? (
                      <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        Leading
                      </span>
                    ) : null}
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${weekStatusBadgeClass(weekStatus ?? null)}`}
                    >
                      {weekStatusLabel(weekStatus ?? null)}
                    </span>
                  </div>
                </div>
                <p className="text-3xl font-bold tabular-nums">{votes}</p>
                {submissions.length === 2 && totalVotes > 0 ? (
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{pct}% of votes</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default async function SpotlightAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await connectMongoose();
  const { view } = await searchParams;
  const showArchived = view === 'archived';

  const pendingCount = await CampaignSubmissionModel.countDocuments({ status: 'pending' });
  const scheduledCount = await CampaignSubmissionModel.countDocuments({ status: 'scheduled' });
  const archivedCount = await CampaignSubmissionModel.countDocuments({ status: 'archived' });

  const activeWeek = await getOpenVotingWeekSubmissions();
  const votingSubmissions = activeWeek.submissions.map((s) => ({
    _id: { toString: () => s._id },
    companyName: s.companyName,
    founder: s.founder,
    votes: s.votes,
    votingStartDate: s.votingStartDate,
  }));

  const now = new Date();
  const activeSchedule = (await CampaignScheduleModel.findOne({
    startDate: { $lte: now },
    endDate: { $gt: now },
  })
    .populate('submissionId')
    .lean()) as { submissionId?: { companyName?: string } } | null;

  const activeCompanyName = activeSchedule?.submissionId?.companyName || 'None';

  const recentSubmissions = (await CampaignSubmissionModel.find(
    showArchived ? { status: 'archived' } : { status: { $ne: 'archived' } },
  )
    .sort({ createdAt: -1 })
    .limit(showArchived ? 50 : 10)
    .lean()) as unknown as Array<{
    _id: { toString(): string };
    companyName: string;
    website?: string;
    industry: string;
    status: string;
    votes?: number;
    votingStartDate?: Date;
    resubmittedAt?: Date;
    createdAt: Date;
  }>;

  const submissionRows: SpotlightSubmissionRow[] = recentSubmissions.map((sub) => ({
    id: sub._id.toString(),
    companyName: sub.companyName,
    website: sub.website,
    industry: sub.industry,
    status: sub.status,
    votes: sub.votes,
    votingStartDate: sub.votingStartDate?.toISOString(),
    resubmittedAt: sub.resubmittedAt?.toISOString(),
    createdAt: sub.createdAt.toISOString(),
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Spotlight Administration</h1>
        <Link href="/admin/spotlight/voting" className="text-sm text-primary hover:underline font-medium">
          Voting dashboard →
        </Link>
      </div>

      <ActiveVoteCard
        submissions={votingSubmissions}
        weekLabel={activeWeek.label}
        weekStatus={activeWeek.status}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border rounded-lg p-6 space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Pending Submissions</p>
          <p className="text-3xl font-bold">{pendingCount}</p>
        </div>
        <div className="bg-card border rounded-lg p-6 space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Scheduled Spotlights</p>
          <p className="text-3xl font-bold">{scheduledCount}</p>
        </div>
        <div className="bg-card border rounded-lg p-6 space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Active This Week</p>
          <p className="text-3xl font-bold">{activeCompanyName}</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center gap-4 bg-muted/50">
          <h2 className="font-semibold text-lg">
            {showArchived ? 'Archived Submissions' : 'Recent Submissions'}
          </h2>
          <div className="flex items-center gap-3 text-sm">
            {showArchived ? (
              <Link href="/admin/spotlight" className="text-primary hover:underline font-medium">
                ← Back to active submissions
              </Link>
            ) : archivedCount > 0 ? (
              <Link
                href="/admin/spotlight?view=archived"
                className="text-muted-foreground hover:text-primary font-medium"
              >
                View archived ({archivedCount})
              </Link>
            ) : null}
          </div>
        </div>
        <SpotlightSubmissionsTable
          submissions={submissionRows}
          showArchiveAction={!showArchived}
        />
      </div>
    </div>
  );
}
