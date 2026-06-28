'use server';

import { getServerSession } from '@/lib/auth/session';
import { isPlatformAdmin } from '@/lib/auth/platformAdmin';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { redirect } from 'next/navigation';

import { CampaignAssetModel } from '@/models/CampaignAsset';

export async function deleteSubmissionAction(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!(await isPlatformAdmin(session.user.id))) throw new Error('Forbidden');

  await connectMongoose();
  await CampaignSubmissionModel.findByIdAndDelete(id);

  return { success: true };
}

export async function updateSubmissionStatusAction(id: string, status: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!(await isPlatformAdmin(session.user.id))) throw new Error('Forbidden');

  await connectMongoose();
  await CampaignSubmissionModel.findByIdAndUpdate(id, { status });

  if (status === 'approved') {
    // Generate dummy/pending assets
    const assetTypes = ['signature_image', 'social_post_1', 'social_post_2', 'landing_page_hero'];
    for (const assetType of assetTypes) {
      await CampaignAssetModel.findOneAndUpdate(
        { submissionId: id, assetType },
        { status: 'pending_generation' },
        { upsert: true }
      );
    }
  }

  return { success: true };
}
