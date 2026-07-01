'use server';

import { getServerSession } from '@/lib/auth/session';
import { isPlatformAdmin } from '@/lib/auth/platformAdmin';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { CampaignAssetModel } from '@/models/CampaignAsset';
import {
  buildSpotlightHallOfFameEmail,
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
import { canAddToHallOfFame } from '@/lib/campaigns/hallOfFame';
import {
  notifySpotlightSubmitter,
  spotlightEmailWarningMessage,
} from '@/lib/campaigns/notifySpotlightSubmitter';
import type { CampaignSubmissionDoc } from '@/models/CampaignSubmission';

export type UpdateSubmissionStatusOptions = {
  votingStartDate?: Date;
  reviewerNotes?: string;
};

export type VotingWeekOptionDto = {
  weekStart: string;
  label: string;
  scheduledCount: number;
};

export type SpotlightActionResult = {
  success: boolean;
  emailWarning?: string;
  hallOfFame?: boolean;
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
): Promise<SpotlightActionResult> {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!(await isPlatformAdmin(session.user.id))) throw new Error('Forbidden');

  if (status === 'approved') {
    throw new Error('Submissions must go through community voting. Schedule a voting week instead.');
  }

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
  });
  if (!submission) throw new Error('Submission not found');

  const reviewerNotes = options?.reviewerNotes ?? submission.reviewerNotes;
  const doc = submission as unknown as CampaignSubmissionDoc;
  let emailWarning: string | undefined;

  if (status === 'voting') {
    const assetTypes = ['signature_image', 'social_post_1', 'social_post_2', 'landing_page_hero'];
    for (const assetType of assetTypes) {
      await CampaignAssetModel.findOneAndUpdate(
        { submissionId: id, assetType },
        { status: 'pending_generation' },
        { upsert: true },
      );
    }

    const notify = await notifySpotlightSubmitter(
      submission.userId,
      (s) =>
        buildSpotlightVotingEmail(s, normalizedVotingStart ?? submission.votingStartDate),
      doc,
    );
    emailWarning = spotlightEmailWarningMessage(notify);
  } else if (status === 'needs_changes') {
    if (!options?.reviewerNotes?.trim()) {
      throw new Error('Please describe what the applicant should change.');
    }
    const notify = await notifySpotlightSubmitter(
      submission.userId,
      (s) => buildSpotlightNeedsChangesEmail(s, reviewerNotes),
      doc,
    );
    emailWarning = spotlightEmailWarningMessage(notify);
  } else if (status === 'rejected') {
    const notify = await notifySpotlightSubmitter(
      submission.userId,
      (s) => buildSpotlightRejectedEmail(s, reviewerNotes),
      doc,
    );
    emailWarning = spotlightEmailWarningMessage(notify);
  }

  return { success: true, ...(emailWarning ? { emailWarning } : {}) };
}

export async function toggleHallOfFameAction(id: string): Promise<SpotlightActionResult> {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!(await isPlatformAdmin(session.user.id))) throw new Error('Forbidden');

  await connectMongoose();
  const submission = await CampaignSubmissionModel.findById(id);
  if (!submission) throw new Error('Not found');

  const turningOn = !submission.hallOfFame;
  if (turningOn && !canAddToHallOfFame(submission)) {
    throw new Error('Only community vote winners can be added to the Hall of Fame.');
  }

  submission.hallOfFame = !submission.hallOfFame;
  await submission.save();

  let emailWarning: string | undefined;
  if (turningOn) {
    const notify = await notifySpotlightSubmitter(
      submission.userId,
      buildSpotlightHallOfFameEmail,
      submission as unknown as CampaignSubmissionDoc,
    );
    emailWarning = spotlightEmailWarningMessage(notify);
  }

  return {
    success: true,
    hallOfFame: submission.hallOfFame,
    ...(emailWarning ? { emailWarning } : {}),
  };
}
