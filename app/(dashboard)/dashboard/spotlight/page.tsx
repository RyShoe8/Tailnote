import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';

export default async function SpotlightDashboardPage() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect('/login');
  }

  await connectMongoose();
  const submission = (await CampaignSubmissionModel.findOne({ userId: session.user.id }).lean()) as any;

  return (
    <div className="max-w-4xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Spotlight</h1>
        <p className="text-muted-foreground">Manage your Tailnote Spotlight submission.</p>
      </div>

      {!submission ? (
        <div className="rounded-lg border bg-card text-card-foreground p-8 text-center space-y-4">
          <h2 className="text-xl font-semibold">Ready to get featured?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Apply to be featured in the Tailnote Spotlight and get your startup in front of thousands of founders.
          </p>
          <Button asChild size="lg" className="mt-4">
            <Link href="/dashboard/spotlight/apply">Apply for Spotlight</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">{submission.companyName as string}</h2>
              <p className="text-muted-foreground">{submission.website as string}</p>
            </div>
            <div className="px-3 py-1 bg-muted rounded-full text-sm font-medium capitalize">
              Status: {submission.status as string}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Application Details</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Founder:</span> {submission.founder as string}
              </div>
              <div>
                <span className="text-muted-foreground">Industry:</span> {submission.industry as string}
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground block mb-1">Quote:</span>
                <blockquote className="italic border-l-2 pl-4 text-muted-foreground">
                  &quot;{(submission.content as any)?.quote}&quot;
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
