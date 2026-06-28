import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { CampaignScheduleModel } from '@/models/CampaignSchedule';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  // Optional: Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectMongoose();
  const now = new Date();

  // 1. Find scheduled submissions that should now be published
  const schedulesToPublish = await CampaignScheduleModel.find({
    startDate: { $lte: now },
    endDate: { $gt: now },
  }).lean();

  const toPublishIds = schedulesToPublish.map((s) => s.submissionId);

  if (toPublishIds.length > 0) {
    await CampaignSubmissionModel.updateMany(
      {
        _id: { $in: toPublishIds },
        status: 'scheduled',
      },
      { $set: { status: 'published' } }
    );
  }

  // 2. Find published submissions that have ended
  const schedulesToEnd = await CampaignScheduleModel.find({
    endDate: { $lte: now },
  }).lean();

  const toEndIds = schedulesToEnd.map((s) => s.submissionId);

  if (toEndIds.length > 0) {
    await CampaignSubmissionModel.updateMany(
      {
        _id: { $in: toEndIds },
        status: { $in: ['published', 'scheduled'] },
      },
      { $set: { status: 'archived' } }
    );
  }

  return NextResponse.json({
    success: true,
    publishedCount: toPublishIds.length,
    archivedCount: toEndIds.length,
  });
}
