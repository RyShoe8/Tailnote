import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, Trophy, Sparkles, TrendingUp } from 'lucide-react';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { CampaignAnalyticsModel } from '@/models/CampaignAnalytics';
import { BlueskyPostMockup, RedditPostMockup, LinkedInPostMockup } from '@/components/spotlight/SocialPostMockups';

export const metadata: Metadata = {
  title: 'Tailnote Spotlight - Community Marketing Network',
  description: 'Discover and support curated startups in the Tailnote community. Apply to be featured in thousands of email signatures across the network.',
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M+';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'k+';
  }
  return num.toString();
}

export default async function SpotlightHomepage() {
  await connectMongoose();
  
  // Real stats
  const startupsFeatured = await CampaignSubmissionModel.countDocuments({
    status: { $in: ['scheduled', 'published', 'archived'] }
  });

  const analyticsAgg = await CampaignAnalyticsModel.aggregate([
    {
      $group: {
        _id: null,
        totalImpressions: { $sum: '$impressions' },
        totalClicks: { $sum: '$clicks' }
      }
    }
  ]);
  
  // Safe fallbacks to realistic baseline numbers or 0
  const totalImpressions = analyticsAgg.length > 0 ? analyticsAgg[0].totalImpressions : 0;
  const totalClicks = analyticsAgg.length > 0 ? analyticsAgg[0].totalClicks : 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-muted py-24 text-center">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Cross-promote.<br />Grow together.
            </h1>
            <p className="mx-auto max-w-[750px] text-lg text-muted-foreground sm:text-xl">
              Tailnote Spotlight is a fun, community-powered network where founders help each other grow. Build your custom signature, share an inspiring quote, and you could be featured across the Tailnote network!
            </p>
            <div className="flex flex-col gap-4 sm:flex-row justify-center pt-4">
              <Link
                href="/spotlight/join"
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Apply with your Quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/spotlight/winners"
                className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                View the Hall of Fame
                <Trophy className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 border-b">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How Spotlight works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We hand-pick our favorite quotes submitted by founders every week to share with the community. It&apos;s a great way to support and cross-promote one another!
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold">Build Your Signature</h3>
              <p className="text-muted-foreground">Use our visual editor to design the exact signature that will be featured across our network.</p>
            </div>
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold">Share a Quote</h3>
              <p className="text-muted-foreground">Submit a fun, short quote or thought to share with the rest of the founder community.</p>
            </div>
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold">Get Featured</h3>
              <p className="text-muted-foreground">If selected, your quote and signature will be shared to help promote your business to other founders.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-3 text-center">
            <div className="space-y-2">
              <Sparkles className="mx-auto h-8 w-8 text-primary" />
              <h3 className="text-3xl font-bold">{startupsFeatured > 0 ? startupsFeatured : '0'}</h3>
              <p className="text-muted-foreground">Startups Featured</p>
            </div>
            <div className="space-y-2">
              <TrendingUp className="mx-auto h-8 w-8 text-primary" />
              <h3 className="text-3xl font-bold">{formatNumber(totalImpressions)}</h3>
              <p className="text-muted-foreground">Signature Views Generated</p>
            </div>
            <div className="space-y-2">
              <Trophy className="mx-auto h-8 w-8 text-primary" />
              <h3 className="text-3xl font-bold">{formatNumber(totalClicks)}</h3>
              <p className="text-muted-foreground">Clicks Delivered</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">More Than Just Signatures</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Spotlight winners get featured across the entire Tailnote network. 
              Here is what a typical feature looks like when your startup wins.
            </p>
          </div>
          <div className="flex flex-col gap-12 items-center">
            <div className="space-y-4 w-full flex flex-col items-center">
              <h3 className="font-semibold text-xl text-center">Bluesky Spotlight</h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">A dedicated post to our community featuring your signature and a brief description of what you&apos;re building.</p>
              <BlueskyPostMockup 
                companyName="Acme Corp"
                description="Acme is building the next generation of widgets for modern teams. We love their focus on speed and reliability!"
                founderName="Jane Doe"
                logoInitial="A"
                quote="The best marketing is helpful. We make your team 10x faster."
              />
            </div>
            <div className="space-y-4 w-full flex flex-col items-center">
              <h3 className="font-semibold text-xl text-center">Reddit Feature</h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">We share your story with startup communities, driving high-intent traffic to your website.</p>
              <RedditPostMockup 
                companyName="Acme Corp"
                description="Acme is building the next generation of widgets for modern teams. We love their focus on speed and reliability!"
                founderName="Jane Doe"
                logoInitial="A"
                quote="The best marketing is helpful. We make your team 10x faster."
              />
            </div>
            <div className="space-y-4 w-full flex flex-col items-center">
              <h3 className="font-semibold text-xl text-center">LinkedIn Hall of Fame</h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">Top winners are inducted into our LinkedIn Hall of Fame, reaching thousands of professionals.</p>
              <LinkedInPostMockup 
                companyName="Acme Corp"
                description="Acme is building the next generation of widgets for modern teams. We love their focus on speed and reliability!"
                founderName="Jane Doe"
                logoInitial="A"
                quote="The best marketing is helpful. We make your team 10x faster."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Latest Spotlight */}
      <section className="py-24">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">Latest Spotlights</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Placeholder for Spotlight Grid */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-xl">Acme Corp</h3>
                  <p className="text-sm text-muted-foreground">Making the best widgets for modern teams.</p>
                </div>
                <Link href="/spotlight/acme-corp" className="inline-flex text-primary hover:underline text-sm font-medium">
                  Read more →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
