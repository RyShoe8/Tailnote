'use server';

import { getServerSession } from '@/lib/auth/session';
import { isPlatformAdmin } from '@/lib/auth/platformAdmin';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { buildSpotlightApprovedEmail } from '@/lib/email/templates/spotlight';
import {
  notifySpotlightSubmitter,
  spotlightEmailWarningMessage,
} from '@/lib/campaigns/notifySpotlightSubmitter';
import type { CampaignSubmissionDoc } from '@/models/CampaignSubmission';
import type { SpotlightVotingWeekStatus } from '@/models/SpotlightVotingWeek';
import {
  getSubmissionsForWeek,
  resolveVotingWeek,
  setVotingWeekStatus,
} from '@/lib/campaigns/spotlightVotingWeeks';
import { coerceToDate, getWeekStart } from '@/lib/campaigns/votingWeekUtils';

async function requirePlatformAdmin() {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!(await isPlatformAdmin(session.user.id))) throw new Error('Forbidden');
}

export async function setVotingWeekStatusAction(weekStartIso: string, status: SpotlightVotingWeekStatus) {
  await requirePlatformAdmin();
  await connectMongoose();
  const weekStart = getWeekStart(coerceToDate(weekStartIso));
  await setVotingWeekStatus(weekStart, status);
  return { success: true };
}

export async function endVotingWeekAction(weekStartIso: string) {
  await requirePlatformAdmin();
  await connectMongoose();

  const weekStart = getWeekStart(coerceToDate(weekStartIso));
  const { getWeekEnd } = await import('@/lib/campaigns/votingWeekUtils');
  const weekEnd = getWeekEnd(weekStart);

  const votingSubmissions = await CampaignSubmissionModel.find({
    status: 'voting',
    votingStartDate: { $gte: weekStart, $lt: weekEnd },
  });

  const result = await resolveVotingWeek(weekStart);
  if (!result.success) {
    return { success: false, message: result.message ?? 'Failed to end voting week' };
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

/** @deprecated Use endVotingWeekAction for a specific week */
export async function resolveVoteAction() {
  await requirePlatformAdmin();
  await connectMongoose();

  const { getVotingWeeksWithSubmissions } = await import('@/lib/campaigns/spotlightVotingWeeks');
  const groups = await getVotingWeeksWithSubmissions();
  const active = groups.find((g) => g.status === 'open' || g.status === 'paused') ?? groups[0];
  if (!active) {
    return { success: false, message: 'No active voting submissions' };
  }

  return endVotingWeekAction(active.weekStart);
}

export async function getVotingWeekSubmissionsAction(weekStartIso: string) {
  await requirePlatformAdmin();
  await connectMongoose();
  const weekStart = getWeekStart(coerceToDate(weekStartIso));
  const submissions = await getSubmissionsForWeek(weekStart);
  return { submissions };
}
