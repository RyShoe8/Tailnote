import { redirect } from 'next/navigation';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignModel } from '@/models/Campaign';
import { SpotlightEditorWorkspace } from '@/components/spotlight/SpotlightEditorWorkspace';
import { getServerSession } from '@/lib/auth/session';

export default async function SpotlightApplyPage() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect('/spotlight/join');
  }

  await connectMongoose();
  let spotlightCampaign = await CampaignModel.findOne({ type: 'spotlight' }).lean();
  
  if (!spotlightCampaign) {
    // Auto-create if it doesn't exist for some reason
    const newCampaign = await CampaignModel.create({
      name: 'Tailnote Spotlight',
      type: 'spotlight',
      status: 'active'
    });
    spotlightCampaign = newCampaign.toObject();
  }

  return (
    <div className="max-w-full min-w-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Apply for Tailnote Spotlight</h1>
        <p className="text-muted-foreground mt-2">
          Design your spotlight profile below. This acts as your live application. When featured, your company and quote will be shared in social media posts across the Tailnote network!
        </p>
      </div>
      
      <SpotlightEditorWorkspace campaignId={(spotlightCampaign as any)._id.toString()} />
    </div>
  );
}
