import { getServerSession } from '@/lib/auth/session';
import { isPlatformAdmin } from '@/lib/auth/platformAdmin';
import { redirect } from 'next/navigation';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { VotingDashboardClient } from './VotingDashboardClient';
import Link from 'next/link';

export default async function AdminVotingPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/login');
  if (!(await isPlatformAdmin(session.user.id))) redirect('/dashboard');

  await connectMongoose();

  const votingSubmissions = await CampaignSubmissionModel.find({ status: 'voting' })
    .sort({ votes: -1, createdAt: 1 })
    .lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Spotlight Vote</h1>
          <p className="text-muted-foreground mt-1">Manage the current community vote and schedule winners.</p>
        </div>
        <Link href="/admin/spotlight" className="text-primary hover:underline">
          &larr; Back to Spotlight
        </Link>
      </div>
      
      {votingSubmissions.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <h2 className="text-xl font-semibold mb-2">No Active Votes</h2>
          <p className="text-muted-foreground">Move submissions to the "voting" status to see them here.</p>
        </div>
      ) : (
        <VotingDashboardClient submissions={JSON.parse(JSON.stringify(votingSubmissions))} />
      )}
    </div>
  );
}
