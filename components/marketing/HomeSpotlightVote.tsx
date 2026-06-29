import Link from 'next/link';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { ArrowRight, Sparkles } from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';
import { renderSpotlightSample } from '@/lib/marketing/renderMarketingSample';
import { stripSignaturePreviewLinks } from '@/lib/marketing/stripSignaturePreviewLinks';
import { MarketingSignaturePreview } from '@/components/marketing/MarketingSignaturePreview';

export async function HomeSpotlightVote() {
  await connectMongoose();

  // Fetch active voting submissions
  const votingSubmissions = await CampaignSubmissionModel.find({
    status: 'voting',
    $or: [
      { votingStartDate: { $exists: false } },
      { votingStartDate: null },
      { votingStartDate: { $lte: new Date() } }
    ]
  })
    .select('_id companyName founder industry logoUrl content votes')
    .sort({ createdAt: 1 })
    .limit(2)
    .lean();

  const hasActiveVoting = votingSubmissions.length > 0;

  return (
    <section className="bg-muted/30 py-16 sm:py-20">
      <div className="container">
        <RevealOnScroll>
          <div className="mx-auto max-w-5xl text-center">
            {hasActiveVoting ? (
              <>
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

                <div className="mt-12 grid md:grid-cols-2 gap-8 text-left">
                  {votingSubmissions.map((submission: any) => {
                    const quote = (submission.content as any)?.quote || '';
                    const signatureHtml = stripSignaturePreviewLinks(
                      renderSpotlightSample(quote, submission.companyName, 'modern_professional')
                    );
                    return (
                      <div key={submission._id.toString()} className="rounded-lg border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                          {submission.logoUrl ? (
                            <img src={submission.logoUrl} alt={`${submission.companyName} logo`} className="h-12 w-12 rounded-full object-cover border" />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                              {submission.companyName.substring(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{submission.companyName}</h3>
                            <p className="text-sm text-muted-foreground">{submission.founder}</p>
                          </div>
                        </div>
                        <blockquote className="italic text-muted-foreground mb-4">
                          &quot;{quote}&quot;
                        </blockquote>
                        <div className="overflow-x-auto rounded-lg border bg-card p-4 shadow-sm relative">
                          <div className="absolute top-2 right-2 z-10 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-background/80 px-1 rounded">
                            Tailnote Signature
                          </div>
                          <div className="pt-2 min-w-[400px]">
                            <MarketingSignaturePreview html={signatureHtml} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Link
                  href="/spotlight/vote"
                  className="mt-12 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                >
                  Cast Your Vote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">
                  <Sparkles className="h-4 w-4" />
                  <span>Community Spotlight</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Get featured across our network
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Build your signature, share an inspiring quote, and get featured on Bluesky, Reddit, and LinkedIn. Join our community-powered marketing network.
                </p>
                <Link
                  href="/spotlight"
                  className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                >
                  Learn About Spotlight
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
