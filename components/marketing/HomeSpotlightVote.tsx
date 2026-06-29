import Link from 'next/link';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { ArrowRight, Sparkles } from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';

export async function HomeSpotlightVote() {
  await connectMongoose();

  // Check if there are active voting submissions
  const activeVoting = await CampaignSubmissionModel.countDocuments({
    status: 'voting',
    $or: [
      { votingStartDate: { $exists: false } },
      { votingStartDate: null },
      { votingStartDate: { $lte: new Date() } }
    ]
  });

  if (activeVoting === 0) {
    return null; // Don't show section if no active voting
  }

  return (
    <section className="bg-muted/30 py-16 sm:py-20">
      <div className="container">
        <RevealOnScroll>
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Community Vote Active</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Vote for this week&apos;s Spotlight winner
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Help choose the next startup to be featured across our network. Vote for your favorite founder and their inspiring quote.
            </p>
            <Link
              href="/spotlight/vote"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Cast Your Vote
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
