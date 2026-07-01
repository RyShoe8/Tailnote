import { getServerSession } from '@/lib/auth/session';
import { isPlatformAdmin } from '@/lib/auth/platformAdmin';
import { redirect } from 'next/navigation';
import { connectMongoose } from '@/lib/mongoose';
import { getVotingWeeksWithSubmissions } from '@/lib/campaigns/spotlightVotingWeeks';
import { loginRedirectPath } from '@/lib/auth/redirectToLogin';
import { VotingDashboardClient } from './VotingDashboardClient';
import Link from 'next/link';

export default async function AdminVotingPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect(loginRedirectPath('/admin/spotlight/voting'));
  if (!(await isPlatformAdmin(session.user.id))) redirect('/dashboard');

  await connectMongoose();

  const weeks = await getVotingWeeksWithSubmissions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spotlight Voting Weeks</h1>
          <p className="text-muted-foreground mt-1">
            Manage community votes by week — open, pause, or end each voting period independently.
          </p>
        </div>
        <Link href="/admin/spotlight" className="text-primary hover:underline">
          &larr; Back to Spotlight
        </Link>
      </div>

      {weeks.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <h2 className="text-xl font-semibold mb-2">No voting weeks scheduled</h2>
          <p className="text-muted-foreground">
            Schedule submissions for a voting week from a submission&apos;s admin actions panel.
          </p>
        </div>
      ) : (
        <VotingDashboardClient weeks={JSON.parse(JSON.stringify(weeks))} />
      )}
    </div>
  );
}
