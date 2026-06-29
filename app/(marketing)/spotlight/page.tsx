import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, Sparkles, Trophy } from 'lucide-react';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { BlueskyPostMockup, RedditPostMockup, LinkedInPostMockup } from '@/components/spotlight/SocialPostMockups';

export const metadata: Metadata = {
  title: 'Tailnote Spotlight - Community Marketing Network',
  description: 'Discover and support curated startups in the Tailnote community. Apply to be featured across the Tailnote Spotlight network.',
};



export default async function SpotlightHomepage() {
  await connectMongoose();
  
  // Real stats
  const startupsFeatured = await CampaignSubmissionModel.countDocuments({
    status: { $in: ['scheduled', 'published', 'archived'] }
  });



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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center max-w-6xl mx-auto">
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold">Create & Submit</h3>
              <p className="text-muted-foreground text-sm">Build your signature and submit an inspiring quote to share with the founder community.</p>
            </div>
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold">Voting Week</h3>
              <p className="text-muted-foreground text-sm">Your submission gets scheduled for a voting week where the community can support your entry.</p>
            </div>
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold">Feature Week</h3>
              <p className="text-muted-foreground text-sm">The following week, everyone gets featured! Winners post Tuesday on Bluesky & Reddit + expanded LinkedIn post Wednesday. Runners-up post Thursday.</p>
            </div>
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">4</div>
              <h3 className="text-xl font-semibold">Hall of Fame</h3>
              <p className="text-muted-foreground text-sm">Winners are added to our Hall of Fame with a do-follow link and platform overview.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b">
        <div className="container px-4 md:px-6">
          <div className="flex justify-center text-center">
            <div className="space-y-2">
              <Sparkles className="mx-auto h-8 w-8 text-primary" />
              <h3 className="text-3xl font-bold">{startupsFeatured > 0 ? startupsFeatured : '0'}</h3>
              <p className="text-muted-foreground">Startups Featured</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Links Section */}
      <section className="py-12 border-b">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Follow Our Spotlight Network</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stay connected with our community and see featured startups across our social channels.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <a
                href="https://bsky.app/profile/themediashop.bsky.social"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Bluesky
              </a>
              <a
                href="https://www.reddit.com/r/TheMediaShop/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Reddit
              </a>
              <a
                href="https://www.linkedin.com/in/ryanschumacher/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                LinkedIn
              </a>
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
                companyName="The Media Shop"
                description="The Media Shop is a full-service digital marketing agency helping brands scale through data-driven campaigns and creative content strategies."
                founderName="Ryan Schumacher"
                logoInitial="M"
                quote="Great marketing doesn't feel like marketing."
                presetId="modern_professional"
                blueskyHandle="themediashop.bsky.social"
              />
            </div>
            <div className="space-y-4 w-full flex flex-col items-center">
              <h3 className="font-semibold text-xl text-center">Reddit Feature</h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">We share your story with startup communities, driving high-intent traffic to your website.</p>
              <RedditPostMockup
                companyName="The Media Shop"
                description="The Media Shop specializes in performance marketing for B2B SaaS companies. They've helped over 50 startups achieve 3x growth through targeted campaigns and conversion optimization. Their team combines creative strategy with rigorous analytics to deliver measurable results."
                founderName="Ryan Schumacher"
                logoInitial="M"
                quote="Data without insight is just noise."
                presetId="creator"
                redditSubreddit="TheMediaShop"
              />
            </div>
            <div className="space-y-4 w-full flex flex-col items-center">
              <h3 className="font-semibold text-xl text-center">LinkedIn Hall of Fame</h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">Top winners are inducted into our LinkedIn Hall of Fame, reaching thousands of professionals.</p>
              <LinkedInPostMockup
                companyName="The Media Shop"
                description="The Media Shop is transforming how B2B companies approach growth marketing. By combining creative storytelling with data-driven optimization, they help startups scale efficiently without burning through their budget. Their unique methodology focuses on sustainable growth channels that compound over time rather than one-off campaigns. 🚀 If you're a founder looking to scale your marketing with real ROI, you need to check them out!"
                founderName="Ryan Schumacher"
                logoInitial="M"
                quote="Growth without strategy is just luck."
                presetId="executive_minimalist"
                linkedinProfile="ryanschumacher"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
