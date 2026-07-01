import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getServerSession } from '@/lib/auth/session';
import { loginRedirectPath } from '@/lib/auth/redirectToLogin';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import {
  submissionStatusBadgeClass,
  submissionStatusLabel,
} from '@/lib/campaigns/submissionStatusDisplay';
import { formatVotingWeekLabel, getWeekStart } from '@/lib/campaigns/votingWeekUtils';
import { getVotingWeekStatusForDate } from '@/lib/campaigns/spotlightVotingWeeks';

export default async function SpotlightDashboardPage() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect(loginRedirectPath('/dashboard/spotlight'));
  }

  await connectMongoose();
  const submission = (await CampaignSubmissionModel.findOne({ userId: session.user.id }).lean()) as {
    companyName?: string;
    website?: string;
    founder?: string;
    industry?: string;
    status?: string;
    reviewerNotes?: string;
    votingStartDate?: Date;
    content?: { quote?: string };
  } | null;

  const status = submission?.status ?? '';
  const needsChanges = status === 'needs_changes';
  const isVoting = status === 'voting';
  const votingWeekLabel =
    isVoting && submission?.votingStartDate
      ? formatVotingWeekLabel(getWeekStart(new Date(submission.votingStartDate)))
      : null;

  let votingWeekStatus: Awaited<ReturnType<typeof getVotingWeekStatusForDate>> = null;
  if (isVoting && submission?.votingStartDate) {
    votingWeekStatus = await getVotingWeekStatusForDate(
      getWeekStart(new Date(submission.votingStartDate)),
    );
  }

  const votingIsLive = votingWeekStatus === 'open' || votingWeekStatus === 'paused';
  const votingHasEnded = votingWeekStatus === 'ended';
  const badgeClass = submissionStatusBadgeClass(status);
  const statusLabel = submissionStatusLabel(status);

  return (
    <div className="max-w-4xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Spotlight</h1>
        <p className="text-muted-foreground">Manage your Tailnote Spotlight submission.</p>
      </div>

      {!submission ? (
        <div className="rounded-lg border bg-card text-card-foreground p-8 text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Ready to get featured?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Apply to be featured in the Tailnote Spotlight and get your startup in front of thousands of founders.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto border-t pt-8">
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">Voting Week</h3>
              <p className="text-sm text-muted-foreground">Your submission gets scheduled for a voting week where the community can support your entry.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">Feature Week</h3>
              <p className="text-sm text-muted-foreground">The following week, everyone gets featured on Bluesky and Reddit. Winners also get an expanded LinkedIn post.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">Hall of Fame</h3>
              <p className="text-sm text-muted-foreground">Winners are added to our Hall of Fame with a do-follow link and platform overview.</p>
            </div>
          </div>
          <Button asChild size="lg" className="mt-8">
            <Link href="/dashboard/spotlight/apply">Apply for Spotlight</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6 space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-xl font-semibold">{submission.companyName}</h2>
              <p className="text-muted-foreground">{submission.website}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium shrink-0 ${badgeClass}`}>
              {statusLabel}
            </span>
          </div>

          {needsChanges ? (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-3">
              <p className="text-sm font-medium text-orange-900">Your application needs a few updates before we can move forward.</p>
              {submission.reviewerNotes?.trim() ? (
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Reviewer notes</p>
                  <p className="whitespace-pre-wrap">{submission.reviewerNotes}</p>
                </div>
              ) : null}
              <Button asChild>
                <Link href="/dashboard/spotlight/apply">Edit application</Link>
              </Button>
            </div>
          ) : null}

          {isVoting && votingWeekLabel ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
              <p className="text-sm font-medium text-blue-900">
                Scheduled voting week: {votingWeekLabel}
              </p>
              {votingIsLive ? (
                <>
                  <p className="text-sm text-blue-800">
                    {votingWeekStatus === 'paused'
                      ? 'Community voting is temporarily paused. Check back soon.'
                      : 'Community voting is live — share the public vote page so others can support your signature.'}
                  </p>
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/spotlight/vote">View public vote page</Link>
                  </Button>
                </>
              ) : votingHasEnded ? (
                <p className="text-sm text-blue-800">Voting for this week has closed.</p>
              ) : (
                <p className="text-sm text-blue-800">Community voting opens when the admin starts this week.</p>
              )}
            </div>
          ) : null}

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Application Details</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <span className="text-muted-foreground">Founder:</span> {submission.founder}
              </div>
              <div>
                <span className="text-muted-foreground">Industry:</span> {submission.industry}
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground block mb-1">Quote:</span>
                <blockquote className="italic border-l-2 pl-4 text-muted-foreground">
                  &quot;{submission.content?.quote}&quot;
                </blockquote>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">What happens when you are featured?</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Your submission is scheduled for a voting week where the community can support your entry.</li>
                <li>The following week, everyone gets featured on Bluesky and Reddit.</li>
                <li>Winners receive an expanded LinkedIn post and are added to the Hall of Fame with a do-follow link.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
