import { redirect } from 'next/navigation';
import { getActiveSpotlight } from '@/lib/campaigns/getActiveSpotlight';
import { SpotlightEditorWorkspace } from '@/components/spotlight/SpotlightEditorWorkspace';
import { getServerSession } from '@/lib/auth/session';

export default async function SpotlightApplyPage() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect('/spotlight/join');
  }

  const spotlight = await getActiveSpotlight();
  
  if (!spotlight || !spotlight.campaignId) {
    return (
      <div className="max-w-2xl text-center py-12 space-y-4">
        <h1 className="text-2xl font-bold">No active Spotlight</h1>
        <p className="text-muted-foreground">There is no active Spotlight campaign at the moment.</p>
      </div>
    );
  }

  return (
    <div className="max-w-full min-w-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Apply for Tailnote Spotlight</h1>
        <p className="text-muted-foreground mt-2">
          Design your spotlight profile below. This acts as your live application. When featured, your profile will be attached to thousands of emails across the Tailnote network!
        </p>
      </div>
      
      <SpotlightEditorWorkspace campaignId={spotlight.campaignId} />
    </div>
  );
}
