'use server';

import { getServerSession } from '@/lib/auth/session';
import { isPlatformAdmin } from '@/lib/auth/platformAdmin';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { CampaignScheduleModel } from '@/models/CampaignSchedule';
import { buildSpotlightApprovedEmail } from '@/lib/email/templates/spotlight';
import {
  notifySpotlightSubmitter,
  spotlightEmailWarningMessage,
} from '@/lib/campaigns/notifySpotlightSubmitter';
import type { CampaignSubmissionDoc } from '@/models/CampaignSubmission';

function getNextDayOfWeek(date: Date, dayOfWeek: number) {
  const resultDate = new Date(date.getTime());
  resultDate.setDate(date.getDate() + ((7 + dayOfWeek - date.getDay()) % 7 || 7));
  resultDate.setHours(9, 0, 0, 0);
  return resultDate;
}

export async function resolveVoteAction() {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!(await isPlatformAdmin(session.user.id))) throw new Error('Forbidden');

  await connectMongoose();

  const votingSubmissions = await CampaignSubmissionModel.find({ status: 'voting' }).sort({
    votes: -1,
  });

  if (votingSubmissions.length === 0) {
    return { success: false, message: 'No active voting submissions' };
  }

  const winner = votingSubmissions[0];
  const losers = votingSubmissions.slice(1);

  const now = new Date();
  const tuesday = getNextDayOfWeek(now, 2);
  const thursday = getNextDayOfWeek(now, 4);

  winner.status = 'scheduled';
  winner.isVoteWinner = true;
  await winner.save();
  await CampaignScheduleModel.findOneAndUpdate(
    { submissionId: winner._id },
    { startDate: tuesday, endDate: new Date(tuesday.getTime() + 7 * 24 * 60 * 60 * 1000) },
    { upsert: true },
  );

  for (const loser of losers) {
    loser.status = 'scheduled';
    loser.isVoteWinner = false;
    await loser.save();
    await CampaignScheduleModel.findOneAndUpdate(
      { submissionId: loser._id },
      { startDate: thursday, endDate: new Date(thursday.getTime() + 7 * 24 * 60 * 60 * 1000) },
      { upsert: true },
    );
  }

  const emailWarnings: string[] = [];

  for (const submission of votingSubmissions) {
    const notify = await notifySpotlightSubmitter(
      String(submission.userId),
      buildSpotlightApprovedEmail,
      submission as unknown as CampaignSubmissionDoc,
      submission.email,
    );
    const warning = spotlightEmailWarningMessage(notify);
    if (warning) emailWarnings.push(`${submission.companyName}: ${warning}`);
  }

  return {
    success: true,
    ...(emailWarnings.length > 0 ? { emailWarnings } : {}),
  };
}
