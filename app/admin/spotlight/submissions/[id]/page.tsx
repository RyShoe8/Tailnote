import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { SubmissionActions } from './SubmissionActions';

export default async function SpotlightSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  await connectMongoose();
  const submission = (await CampaignSubmissionModel.findById(id).lean()) as any;
  
  if (!submission) {
    notFound();
  }

  const quote = (submission.content as any)?.quote || '';
  const description = (submission.content as any)?.description || '';
  const whyShouldWeFeatureYou = (submission.content as any)?.whyShouldWeFeatureYou || '';

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <Link href="/admin/spotlight" className="text-sm text-muted-foreground hover:underline">
          ← Back to Submissions
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{submission.companyName}</h1>
            <a href={submission.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{submission.website}</a>
          </div>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium capitalize">{submission.status}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Application Details</h2>
            
            <div className="flex items-center gap-4 mb-4">
              {submission.logoUrl ? (
                <img src={submission.logoUrl} alt="Logo" className="w-16 h-16 rounded object-contain border bg-white" />
              ) : null}
              <div>
                <p className="font-semibold">{submission.founder}</p>
                <p className="text-sm text-muted-foreground">Founder</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Industry</p>
                <p>{submission.industry}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Company Size</p>
                <p>{submission.companySize}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground font-medium">Quote</p>
              <p className="italic">&quot;{quote}&quot;</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground font-medium">Description</p>
              <p>{description}</p>
            </div>

            {whyShouldWeFeatureYou ? (
              <div>
                <p className="text-sm text-muted-foreground font-medium">Why should we feature you?</p>
                <p>{whyShouldWeFeatureYou}</p>
              </div>
            ) : null}

            {submission.socialPlatforms && submission.socialPlatforms.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground font-medium">Social Platforms</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {submission.socialPlatforms.map((platform: string) => (
                    <span key={platform} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded capitalize">
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {submission.socialProfiles && Object.keys(submission.socialProfiles).length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground font-medium">Social Profiles</p>
                <div className="flex flex-col gap-1 mt-1">
                  {Object.entries(submission.socialProfiles).map(([platform, url]) => (
                    <a key={platform} href={url as string} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline capitalize">
                      {platform}: {url as string}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <SubmissionActions submissionId={id} />
        </div>
      </div>
    </div>
  );
}
