import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import {
  MAX_VOTING_SUBMISSIONS_PER_WEEK,
  getWeekEnd,
  isSchedulableWeekStart,
} from '@/lib/campaigns/votingWeekUtils';

export {
  MAX_VOTING_SUBMISSIONS_PER_WEEK,
  getUpcomingVotingWeeks,
  getFirstSchedulableWeekStart,
  isSchedulableWeekStart,
  getWeekEnd,
  getWeekStart,
  formatVotingWeekLabel,
  formatWeekScheduleCount,
  type VotingWeekOption,
} from '@/lib/campaigns/votingWeekUtils';

export async function countVotingSubmissionsForWeek(
  weekStart: Date,
  excludeSubmissionId?: string,
): Promise<number> {
  const weekEnd = getWeekEnd(weekStart);
  const filter: Record<string, unknown> = {
    status: 'voting',
    votingStartDate: { $gte: weekStart, $lt: weekEnd },
  };

  if (excludeSubmissionId) {
    filter._id = { $ne: excludeSubmissionId };
  }

  return CampaignSubmissionModel.countDocuments(filter);
}

export async function assertCanScheduleForWeek(
  weekStart: Date,
  excludeSubmissionId?: string,
): Promise<void> {
  if (!isSchedulableWeekStart(weekStart)) {
    throw new Error('Voting can only be scheduled for today or a future week.');
  }

  const count = await countVotingSubmissionsForWeek(weekStart, excludeSubmissionId);
  if (count >= MAX_VOTING_SUBMISSIONS_PER_WEEK) {
    throw new Error(
      `This voting week already has ${MAX_VOTING_SUBMISSIONS_PER_WEEK} companies scheduled. Choose another week.`,
    );
  }
}
