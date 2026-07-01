import { connectMongoose } from '@/lib/mongoose';
import {
  getNextWeekPreviewSubmissions,
  getOpenVotingWeekSubmissions,
} from '@/lib/campaigns/spotlightVotingWeeks';
import { VoteClient } from './VoteClient';

export const revalidate = 0;

export default async function SpotlightVotePage() {
  await connectMongoose();

  const [activeWeek, nextWeek] = await Promise.all([
    getOpenVotingWeekSubmissions(),
    getNextWeekPreviewSubmissions(),
  ]);

  const hasActiveVote = activeWeek.submissions.length > 0;
  const hasPreview = nextWeek.submissions.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          Spotlight Community Vote
        </h1>
        <p className="text-xl text-muted-foreground">
          Vote for your favorite Spotlight signature to be featured as our top winner this week.
        </p>
      </div>

      <section className="space-y-8 mb-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold">This week&apos;s vote</h2>
          {activeWeek.label ? (
            <p className="text-muted-foreground mt-1">{activeWeek.label}</p>
          ) : null}
        </div>

        {!hasActiveVote ? (
          <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold mb-2">No active vote right now</h3>
            <p className="text-muted-foreground">
              Check back when the next voting week opens, or see who&apos;s coming up below.
            </p>
          </div>
        ) : (
          <VoteClient
            initialSubmissions={JSON.parse(JSON.stringify(activeWeek.submissions))}
            paused={activeWeek.status === 'paused'}
          />
        )}
      </section>

      {hasPreview ? (
        <section className="space-y-8 border-t pt-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold">Coming next week</h2>
            {nextWeek.label ? (
              <p className="text-muted-foreground mt-1">
                {nextWeek.label} — preview only, voting opens when the week is live.
              </p>
            ) : null}
          </div>
          <VoteClient
            initialSubmissions={JSON.parse(JSON.stringify(nextWeek.submissions))}
            readOnly
            previewLabel="Voting opens soon"
          />
        </section>
      ) : null}
    </div>
  );
}
