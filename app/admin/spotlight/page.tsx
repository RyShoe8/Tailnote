import Link from 'next/link';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { CampaignScheduleModel } from '@/models/CampaignSchedule';
import {
  submissionStatusBadgeClass,
  submissionStatusLabel,
} from '@/lib/campaigns/submissionStatusDisplay';

function ActiveVoteCard({
  submissions,
}: {
  submissions: Array<{
    _id: { toString(): string };
    companyName: string;
    founder: string;
    votes?: number;
  }>;
}) {
  const totalVotes = submissions.reduce((sum, s) => sum + (s.votes ?? 0), 0);
  const leaderVotes = submissions[0]?.votes ?? 0;

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg">Active community vote</h2>
          <p className="text-sm text-muted-foreground">
            {submissions.length === 2
              ? `${totalVotes} total vote${totalVotes === 1 ? '' : 's'} cast`
              : submissions.length === 1
                ? 'Waiting for a second entrant this week'
                : 'No submissions in voting status'}
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
                  </div>
                  {isLeader ? (
                    <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                      Leading
                    </span>
                  ) : null}
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

export default async function SpotlightAdminPage() {
  await connectMongoose();

  const pendingCount = await CampaignSubmissionModel.countDocuments({ status: 'pending' });
  const scheduledCount = await CampaignSubmissionModel.countDocuments({ status: 'scheduled' });

  const votingSubmissions = await CampaignSubmissionModel.find({ status: 'voting' })
    .sort({ votes: -1, createdAt: 1 })
    .limit(2)
    .lean();

  const now = new Date();
  const activeSchedule = (await CampaignScheduleModel.findOne({
    startDate: { $lte: now },
    endDate: { $gt: now },
  })
    .populate('submissionId')
    .lean()) as { submissionId?: { companyName?: string } } | null;

  const activeCompanyName = activeSchedule?.submissionId?.companyName || 'None';

  const recentSubmissions = (await CampaignSubmissionModel.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()) as unknown as Array<{
    _id: { toString(): string };
    companyName: string;
    website?: string;
    industry: string;
    status: string;
    votes?: number;
    resubmittedAt?: Date;
    createdAt: Date;
  }>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Spotlight Administration</h1>
        <Link href="/admin/spotlight/voting" className="text-sm text-primary hover:underline font-medium">
          Voting dashboard →
        </Link>
      </div>

      <ActiveVoteCard
        submissions={
          votingSubmissions as unknown as Parameters<typeof ActiveVoteCard>[0]['submissions']
        }
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
        <div className="p-4 border-b flex justify-between items-center bg-muted/50">
          <h2 className="font-semibold text-lg">Recent Submissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Website</th>
                <th className="px-6 py-3">Industry</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Votes</th>
                <th className="px-6 py-3">Date Applied</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No submissions found.
                  </td>
                </tr>
              ) : (
                recentSubmissions.map((sub) => (
                  <tr key={sub._id.toString()} className="border-b hover:bg-muted/30">
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
                    <td className="px-6 py-4 tabular-nums">
                      {sub.status === 'voting' ? (
                        <span className="font-semibold">{sub.votes ?? 0}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{new Date(sub.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/spotlight/submissions/${sub._id.toString()}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {sub.status === 'pending' ? 'Review' : 'View'}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
