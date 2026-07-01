import { redirect } from 'next/navigation';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignModel } from '@/models/Campaign';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { SpotlightEditorWorkspace } from '@/components/spotlight/SpotlightEditorWorkspace';
import { getServerSession } from '@/lib/auth/session';

export default async function SpotlightApplyPage() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect('/spotlight/join');
  }

  await connectMongoose();

  const existingSubmission = (await CampaignSubmissionModel.findOne({
    userId: session.user.id,
  }).lean()) as { status?: string } | null;

  if (existingSubmission && existingSubmission.status !== 'needs_changes') {
    redirect('/dashboard/spotlight');
  }

  let spotlightCampaign = await CampaignModel.findOne({ type: 'spotlight' }).lean();

  if (!spotlightCampaign) {
    const newCampaign = await CampaignModel.create({
      name: 'Tailnote Spotlight',
      type: 'spotlight',
      status: 'active',
    });
    spotlightCampaign = newCampaign.toObject();
  }

  const submissionProp = existingSubmission
    ? JSON.parse(JSON.stringify(existingSubmission))
    : undefined;

  return (
    <div className="max-w-full min-w-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {existingSubmission ? 'Update your Spotlight application' : 'Apply for Tailnote Spotlight'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {existingSubmission
            ? 'Make the requested changes below and resubmit your application for review.'
            : "Design your spotlight profile below. This acts as your live application. After submission, you'll be scheduled for a voting week. The following week, everyone gets featured on Bluesky and Reddit, with winners receiving an expanded LinkedIn post and Hall of Fame induction."}
        </p>
      </div>

      <SpotlightEditorWorkspace
        campaignId={(spotlightCampaign as { _id: { toString(): string } })._id.toString()}
        existingSubmission={submissionProp}
      />
    </div>
  );
}
