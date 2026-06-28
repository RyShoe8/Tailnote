import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { VoteClient } from './VoteClient';

export const revalidate = 0; // Ensure fresh data on load

export default async function SpotlightVotePage() {
  await connectMongoose();

  // Fetch submissions currently up for voting
  const votingSubmissions = await CampaignSubmissionModel.find({ status: 'voting' })
    .select('_id companyName founder industry logoUrl content votes')
    .sort({ createdAt: 1 })
    .lean();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          Spotlight Community Vote 🌟
        </h1>
        <p className="text-xl text-muted-foreground">
          Vote for your favorite startup to be featured as our top Spotlight winner this week.
        </p>
      </div>
      
      {votingSubmissions.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
          <h2 className="text-2xl font-semibold mb-2">No active vote right now</h2>
          <p className="text-muted-foreground">Check back next week to vote on the next batch of startups!</p>
        </div>
      ) : (
        <VoteClient initialSubmissions={JSON.parse(JSON.stringify(votingSubmissions))} />
      )}
    </div>
  );
}
