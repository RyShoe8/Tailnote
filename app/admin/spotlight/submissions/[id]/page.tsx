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
            <div>
              <p className="text-sm text-muted-foreground font-medium">Industry</p>
              <p>{submission.industry}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Quote</p>
              <p className="italic">&quot;{quote}&quot;</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Description</p>
              <p>{description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <SubmissionActions submissionId={id} />
        </div>
      </div>
    </div>
  );
}
