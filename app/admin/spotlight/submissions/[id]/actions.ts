'use server';

import { getServerSession } from '@/lib/auth/session';
import { isPlatformAdmin } from '@/lib/auth/platformAdmin';
import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { redirect } from 'next/navigation';

import { CampaignAssetModel } from '@/models/CampaignAsset';
import { sendEmail } from '@/lib/email/mail';
import {
  buildSpotlightApprovedEmail,
  buildSpotlightNeedsChangesEmail,
  buildSpotlightRejectedEmail,
  buildSpotlightVotingEmail,
} from '@/lib/email/templates/spotlight';

export async function deleteSubmissionAction(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!(await isPlatformAdmin(session.user.id))) throw new Error('Forbidden');

  await connectMongoose();
  await CampaignSubmissionModel.findByIdAndDelete(id);

  return { success: true };
}

export async function updateSubmissionStatusAction(id: string, status: string, votingStartDate?: Date) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!(await isPlatformAdmin(session.user.id))) throw new Error('Forbidden');

  const updatePayload: any = { status };
  if (votingStartDate) {
    updatePayload.votingStartDate = votingStartDate;
  }

  const submission = await CampaignSubmissionModel.findByIdAndUpdate(id, updatePayload).populate('userId');
  if (!submission) throw new Error('Submission not found');
  
  // We need to fetch the user's email address from BetterAuth 'user' collection
  const db = mongoose.connection.db;
  const submitter = db ? await db.collection('user').findOne({ id: submission.userId }) : null;
  const submitterEmail = submitter?.email;

  if (status === 'voting' || status === 'approved') {
    // Generate dummy/pending assets
    const assetTypes = ['signature_image', 'social_post_1', 'social_post_2', 'landing_page_hero'];
    for (const assetType of assetTypes) {
      await CampaignAssetModel.findOneAndUpdate(
        { submissionId: id, assetType },
        { status: 'pending_generation' },
        { upsert: true }
      );
    }
    
    if (submitterEmail) {
      if (status === 'voting') {
        const { subject, html, text } = buildSpotlightVotingEmail(submission as any, votingStartDate);
        await sendEmail({ to: submitterEmail, subject, html, text });
      } else {
        const { subject, html, text } = buildSpotlightApprovedEmail(submission as any);
        await sendEmail({ to: submitterEmail, subject, html, text });
      }
    }
  } else if (status === 'needs_changes') {
    if (submitterEmail) {
      const { subject, html, text } = buildSpotlightNeedsChangesEmail(submission as any, submission.reviewerNotes);
      await sendEmail({ to: submitterEmail, subject, html, text });
    }
  } else if (status === 'rejected') {
    if (submitterEmail) {
      const { subject, html, text } = buildSpotlightRejectedEmail(submission as any, submission.reviewerNotes);
      await sendEmail({ to: submitterEmail, subject, html, text });
    }
  }

  return { success: true };
}

export async function toggleHallOfFameAction(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!(await isPlatformAdmin(session.user.id))) throw new Error('Forbidden');

  await connectMongoose();
  const submission = await CampaignSubmissionModel.findById(id);
  if (!submission) throw new Error('Not found');

  submission.hallOfFame = !submission.hallOfFame;
  await submission.save();

  return { success: true, hallOfFame: submission.hallOfFame };
}
