'use server';

import { getServerSession } from '@/lib/auth/session';
import { isPlatformAdmin } from '@/lib/auth/platformAdmin';
import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';

import { CampaignAssetModel } from '@/models/CampaignAsset';
import { sendEmail } from '@/lib/email/mail';
import {
  buildSpotlightApprovedEmail,
  buildSpotlightNeedsChangesEmail,
  buildSpotlightRejectedEmail,
  buildSpotlightVotingEmail,
} from '@/lib/email/templates/spotlight';
import {
  assertCanScheduleForWeek,
  countVotingSubmissionsForWeek,
  getUpcomingVotingWeeks,
  getWeekStart,
} from '@/lib/campaigns/votingWeeks';

export type UpdateSubmissionStatusOptions = {
  votingStartDate?: Date;
  reviewerNotes?: string;
};

export type VotingWeekOptionDto = {
  weekStart: string;
  label: string;
  scheduledCount: number;
};

export async function getVotingWeekOptionsAction(submissionId?: string): Promise<VotingWeekOptionDto[]> {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!(await isPlatformAdmin(session.user.id))) throw new Error('Forbidden');

  await connectMongoose();

  const weeks = getUpcomingVotingWeeks(12);
  return Promise.all(
    weeks.map(async (week) => ({
      weekStart: week.weekStart.toISOString(),
      label: week.label,
      scheduledCount: await countVotingSubmissionsForWeek(week.weekStart, submissionId),
    })),
  );
}

export async function deleteSubmissionAction(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!(await isPlatformAdmin(session.user.id))) throw new Error('Forbidden');

  await connectMongoose();
  await CampaignSubmissionModel.findByIdAndDelete(id);

  return { success: true };
}

export async function updateSubmissionStatusAction(
  id: string,
  status: string,
  options?: UpdateSubmissionStatusOptions,
) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!(await isPlatformAdmin(session.user.id))) throw new Error('Forbidden');

  await connectMongoose();

  const updatePayload: Record<string, unknown> = { status };

  let normalizedVotingStart: Date | undefined;
  if (status === 'voting') {
    if (!options?.votingStartDate) {
      throw new Error('Select a voting week before scheduling.');
    }
    normalizedVotingStart = getWeekStart(options.votingStartDate);
    await assertCanScheduleForWeek(normalizedVotingStart, id);
    updatePayload.votingStartDate = normalizedVotingStart;
  } else if (options?.votingStartDate) {
    updatePayload.votingStartDate = options.votingStartDate;
  }

  if (options?.reviewerNotes !== undefined) {
    updatePayload.reviewerNotes = options.reviewerNotes;
  }

  const submission = await CampaignSubmissionModel.findByIdAndUpdate(id, updatePayload, {
    new: true,
  }).populate('userId');
  if (!submission) throw new Error('Submission not found');

  const db = mongoose.connection.db;
  const submitter = db ? await db.collection('user').findOne({ id: submission.userId }) : null;
  const submitterEmail = submitter?.email;
  const reviewerNotes = options?.reviewerNotes ?? submission.reviewerNotes;

  if (status === 'voting' || status === 'approved') {
    const assetTypes = ['signature_image', 'social_post_1', 'social_post_2', 'landing_page_hero'];
    for (const assetType of assetTypes) {
      await CampaignAssetModel.findOneAndUpdate(
        { submissionId: id, assetType },
        { status: 'pending_generation' },
        { upsert: true },
      );
    }

    if (submitterEmail) {
      if (status === 'voting') {
        const { subject, html, text } = buildSpotlightVotingEmail(
          submission as any,
          normalizedVotingStart ?? submission.votingStartDate,
        );
        await sendEmail({ to: submitterEmail, subject, html, text });
      } else {
        const { subject, html, text } = buildSpotlightApprovedEmail(submission as any);
        await sendEmail({ to: submitterEmail, subject, html, text });
      }
    }
  } else if (status === 'needs_changes') {
    if (!options?.reviewerNotes?.trim()) {
      throw new Error('Please describe what the applicant should change.');
    }
    if (submitterEmail) {
      const { subject, html, text } = buildSpotlightNeedsChangesEmail(submission as any, reviewerNotes);
      await sendEmail({ to: submitterEmail, subject, html, text });
    }
  } else if (status === 'rejected') {
    if (submitterEmail) {
      const { subject, html, text } = buildSpotlightRejectedEmail(submission as any, reviewerNotes);
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
