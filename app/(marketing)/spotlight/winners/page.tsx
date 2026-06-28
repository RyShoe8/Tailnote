import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Metadata } from 'next';

import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { CampaignScheduleModel } from '@/models/CampaignSchedule';

export const metadata: Metadata = {
  title: 'Tailnote Spotlight - Hall of Fame',
  description: 'View past winners of the Tailnote Spotlight.',
};

export default async function SpotlightWinnersPage() {
  await connectMongoose();

  // Find submissions that were added to the Hall of Fame
  const pastFeatures = await CampaignSubmissionModel.find({
    hallOfFame: true
  })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="flex flex-col min-h-screen py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center space-y-4 mb-16">
          <Trophy className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold tracking-tighter">Spotlight Hall of Fame</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            These standout startups were hand-picked by the community and showcased across the Tailnote network.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {pastFeatures.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No features yet! The Hall of Fame is waiting for its first entries.
            </div>
          ) : (
            pastFeatures.map((feature: any) => (
              <div key={feature._id.toString()} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6 space-y-4">
                  <div className="flex items-center space-x-4">
                    {feature.logoUrl ? (
                      <img src={feature.logoUrl} alt={`${feature.companyName} logo`} className="h-12 w-12 rounded-full object-cover border" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                        {feature.companyName.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-xl">{feature.companyName}</h3>
                    </div>
                  </div>
                  <p className="text-sm italic">&quot;{feature.content?.quote || 'No quote available'}&quot;</p>
                  <Link href={`/spotlight/${feature.slug || feature._id}`} className="inline-flex text-primary hover:underline text-sm font-medium">
                    View Campaign →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
