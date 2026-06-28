import { CampaignScheduleModel } from '@/models/CampaignSchedule';
import { CampaignAssetModel } from '@/models/CampaignAsset';
import { connectMongoose } from '@/lib/mongoose';
import type { RenderSignatureInput } from 'emailsignature-engine';
import type { CampaignSubmissionDoc } from '@/models/CampaignSubmission';

export async function getActiveSpotlight(): Promise<RenderSignatureInput['activeSpotlight'] | undefined> {
  await connectMongoose();
  
  const now = new Date();
  
  const schedule = await CampaignScheduleModel.findOne({
    startDate: { $lte: now },
    endDate: { $gt: now },
  })
    .populate('submissionId')
    .sort({ startDate: -1 })
    .lean() as unknown as { submissionId?: CampaignSubmissionDoc } | null;

  if (!schedule || !schedule.submissionId) return undefined;

  const submission = schedule.submissionId;
  
  const asset = await CampaignAssetModel.findOne({
    submissionId: submission._id,
    assetType: 'signature_image',
  }).lean() as unknown as { url?: string } | null;

  return {
    campaignId: submission._id.toString(),
    slug: submission.slug || submission._id.toString(),
    companyName: submission.companyName,
    logoUrl: submission.logoUrl || '',
    quoteText: (submission.content as any)?.quote || '',
    founder: submission.founder || 'Founder',
    website: submission.website || 'https://tailnote.com',
    signatureImageUrl: asset?.url || '',
  };
}
