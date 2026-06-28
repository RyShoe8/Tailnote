import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { CampaignScheduleModel } from '@/models/CampaignSchedule';
import { CampaignAssetModel } from '@/models/CampaignAsset';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';

const ActionSchema = z.enum(['approve', 'reject', 'schedule', 'save_asset', 'delete']);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Basic admin check (could use a dedicated role or specific user ID)
  // For now, assuming anyone hitting this route must be verified as admin in middleware
  // Or checking user email. Let's do a simple check.
  if (session.user.email !== 'ryan@tailnote.com') { // Adjust based on your admin strategy
    // In many projects admin check is done in middleware or here
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const actionParsed = ActionSchema.safeParse(action);
  if (!actionParsed.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  const validatedAction = actionParsed.data;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  await connectMongoose();

  if (validatedAction === 'approve' || validatedAction === 'reject') {
    const schema = z.object({
      submissionId: z.string().min(1),
      notes: z.string().optional(),
    });
    const parsed = schema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const submission = await CampaignSubmissionModel.findById(parsed.data.submissionId);
    if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    submission.status = validatedAction === 'approve' ? 'approved' : 'rejected';
    if (parsed.data.notes) submission.reviewerNotes = parsed.data.notes;
    
    // If approved, create initial assets placeholder
    if (validatedAction === 'approve') {
      // Create asset records pending generation
      const assetTypes = ['signature_image', 'social_post_1', 'social_post_2', 'landing_page_hero'];
      for (const type of assetTypes) {
        await CampaignAssetModel.findOneAndUpdate(
          { submissionId: submission._id, assetType: type },
          { status: 'pending_generation' },
          { upsert: true, new: true }
        );
      }
    }

    await submission.save();
    return NextResponse.json({ success: true });
  }

  if (validatedAction === 'schedule') {
    const schema = z.object({
      submissionId: z.string().min(1),
      startDate: z.string().min(1),
      endDate: z.string().min(1),
    });
    const parsed = schema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const submission = await CampaignSubmissionModel.findById(parsed.data.submissionId);
    if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    submission.status = 'scheduled';
    await submission.save();

    await CampaignScheduleModel.findOneAndUpdate(
      { submissionId: submission._id },
      {
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  }

  if (validatedAction === 'save_asset') {
    const schema = z.object({
      submissionId: z.string().min(1),
      assetType: z.string().min(1),
      url: z.string().optional(),
      content: z.string().optional(),
    });
    const parsed = schema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    await CampaignAssetModel.findOneAndUpdate(
      { submissionId: parsed.data.submissionId, assetType: parsed.data.assetType },
      {
        url: parsed.data.url,
        content: parsed.data.content,
        status: 'ready',
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  }

  if (validatedAction === 'delete') {
    const schema = z.object({
      submissionId: z.string().min(1),
    });
    const parsed = schema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    await CampaignSubmissionModel.findByIdAndDelete(parsed.data.submissionId);
    await CampaignAssetModel.deleteMany({ submissionId: parsed.data.submissionId });
    await CampaignScheduleModel.deleteMany({ submissionId: parsed.data.submissionId });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
