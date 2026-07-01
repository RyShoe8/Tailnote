import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import {
  SpotlightVotingWeekModel,
  type SpotlightVotingWeekDoc,
  type SpotlightVotingWeekStatus,
} from '@/models/SpotlightVotingWeek';
import { CampaignScheduleModel } from '@/models/CampaignSchedule';
import {
  formatVotingWeekLabel,
  getWeekEnd,
  getWeekStart,
  votingWeekStartIso,
} from '@/lib/campaigns/votingWeekUtils';
import {
  renderSubmissionSignature,
  type RenderSubmissionSignatureInput,
} from '@/lib/campaigns/renderSubmissionSignature';

export type VotingWeekSubmission = {
  _id: string;
  companyName: string;
  founder: string;
  industry?: string;
  logoUrl?: string;
  content?: { quote?: string; quoteAuthor?: string };
  votes: number;
  votingStartDate?: string;
  signatureHtml: string;
};

export type VotingWeekGroup = {
  weekStart: string;
  weekStartDate: Date;
  label: string;
  status: SpotlightVotingWeekStatus;
  submissions: VotingWeekSubmission[];
  totalVotes: number;
};

export function voteCookieNameForWeek(weekStart: Date | string): string {
  const iso = votingWeekStartIso(weekStart).replace(/[:.]/g, '_');
  return `has_voted_spotlight_${iso}`;
}

export function getNextCalendarWeekStart(fromDate = new Date()): Date {
  const current = getWeekStart(fromDate);
  const next = new Date(current.getTime());
  next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

export async function ensureVotingWeek(weekStart: Date): Promise<SpotlightVotingWeekDoc> {
  const normalized = getWeekStart(weekStart);
  const existing = await SpotlightVotingWeekModel.findOne({ weekStart: normalized });
  if (existing) return existing as SpotlightVotingWeekDoc;

  const created = await SpotlightVotingWeekModel.create({
    weekStart: normalized,
    status: 'scheduled',
  });
  return created as SpotlightVotingWeekDoc;
}

export async function getVotingWeekRecord(
  weekStart: Date,
): Promise<SpotlightVotingWeekDoc | null> {
  const normalized = getWeekStart(weekStart);
  return SpotlightVotingWeekModel.findOne({ weekStart: normalized }).lean<SpotlightVotingWeekDoc>();
}

export async function getVotingWeekStatusForDate(
  weekStart: Date | null | undefined,
): Promise<SpotlightVotingWeekStatus | null> {
  if (!weekStart) return null;
  const record = await getVotingWeekRecord(weekStart);
  return record?.status ?? 'scheduled';
}

export async function setVotingWeekStatus(
  weekStart: Date,
  status: SpotlightVotingWeekStatus,
): Promise<SpotlightVotingWeekDoc> {
  const normalized = getWeekStart(weekStart);
  const update: Record<string, unknown> = { status };
  const now = new Date();

  if (status === 'open') {
    update.openedAt = now;
  }
  if (status === 'ended') {
    update.endedAt = now;
  }
  if (status === 'archived') {
    update.archivedAt = now;
  }

  const doc = await SpotlightVotingWeekModel.findOneAndUpdate(
    { weekStart: normalized },
    { $set: update, $setOnInsert: { weekStart: normalized } },
    { upsert: true, new: true },
  );
  if (!doc) throw new Error('Failed to update voting week');
  return doc as SpotlightVotingWeekDoc;
}

function serializeSubmission(
  sub: Record<string, unknown>,
  signatureHtml: string,
): VotingWeekSubmission {
  return {
    _id: String(sub._id),
    companyName: String(sub.companyName ?? ''),
    founder: String(sub.founder ?? ''),
    industry: sub.industry ? String(sub.industry) : undefined,
    logoUrl: sub.logoUrl ? String(sub.logoUrl) : undefined,
    content: sub.content as VotingWeekSubmission['content'],
    votes: typeof sub.votes === 'number' ? sub.votes : 0,
    votingStartDate: sub.votingStartDate
      ? new Date(sub.votingStartDate as Date).toISOString()
      : undefined,
    signatureHtml,
  };
}

async function fetchSubmissionDocsForWeek(
  weekStart: Date,
  options?: { votingStatusOnly?: boolean },
) {
  const normalized = getWeekStart(weekStart);
  const weekEnd = getWeekEnd(normalized);
  const filter: Record<string, unknown> = {
    votingStartDate: { $gte: normalized, $lt: weekEnd },
  };
  if (options?.votingStatusOnly !== false) {
    filter.status = 'voting';
  }
  return CampaignSubmissionModel.find(filter)
    .sort({ votes: -1, createdAt: 1 })
    .lean();
}

async function serializeSubmissionsWithSignatures(
  subs: Record<string, unknown>[],
): Promise<VotingWeekSubmission[]> {
  return Promise.all(
    subs.map(async (sub) => {
      const signatureHtml = await renderSubmissionSignature({
        ...(sub as RenderSubmissionSignatureInput),
        userId: typeof sub.userId === 'string' ? sub.userId : String(sub.userId ?? ''),
      });
      return serializeSubmission(sub, signatureHtml);
    }),
  );
}

export async function getSubmissionsForWeek(
  weekStart: Date,
  options?: { votingStatusOnly?: boolean },
) {
  const subs = await fetchSubmissionDocsForWeek(weekStart, options);
  return serializeSubmissionsWithSignatures(subs as Record<string, unknown>[]);
}

export async function getVotingWeeksWithSubmissions(): Promise<VotingWeekGroup[]> {
  const weekRecords = await SpotlightVotingWeekModel.find({ status: { $ne: 'archived' } })
    .sort({ weekStart: -1 })
    .lean();

  if (weekRecords.length === 0) return [];

  const groups = await Promise.all(
    weekRecords.map(async (record) => {
      const weekStartDate = getWeekStart(record.weekStart);
      const iso = votingWeekStartIso(weekStartDate);
      const status = record.status as SpotlightVotingWeekStatus;
      const votingStatusOnly = status !== 'ended';
      const submissions = await getSubmissionsForWeek(weekStartDate, { votingStatusOnly });
      return {
        weekStart: iso,
        weekStartDate,
        label: formatVotingWeekLabel(weekStartDate),
        status,
        submissions,
        totalVotes: submissions.reduce((sum, s) => sum + s.votes, 0),
      };
    }),
  );

  return groups;
}

export async function getOpenVotingWeekSubmissions(): Promise<{
  weekStart: string | null;
  label: string | null;
  status: SpotlightVotingWeekStatus | null;
  submissions: VotingWeekSubmission[];
}> {
  const openWeek = await SpotlightVotingWeekModel.findOne({ status: { $in: ['open', 'paused'] } })
    .sort({ weekStart: 1 })
    .lean<SpotlightVotingWeekDoc>();

  if (!openWeek) {
    return { weekStart: null, label: null, status: null, submissions: [] };
  }

  const submissions = await getSubmissionsForWeek(openWeek.weekStart, { votingStatusOnly: true });
  return {
    weekStart: votingWeekStartIso(openWeek.weekStart),
    label: formatVotingWeekLabel(openWeek.weekStart),
    status: openWeek.status as SpotlightVotingWeekStatus,
    submissions,
  };
}

export async function getNextWeekPreviewSubmissions(fromDate = new Date()): Promise<{
  weekStart: string | null;
  label: string | null;
  submissions: VotingWeekSubmission[];
}> {
  const nextWeekStart = getNextCalendarWeekStart(fromDate);
  const iso = votingWeekStartIso(nextWeekStart);

  const weekRecord = await getVotingWeekRecord(nextWeekStart);
  const status = weekRecord?.status ?? 'scheduled';
  if (status === 'ended' || status === 'open') {
    return { weekStart: null, label: null, submissions: [] };
  }

  const submissions = await getSubmissionsForWeek(nextWeekStart, { votingStatusOnly: true });
  if (submissions.length === 0) {
    return { weekStart: null, label: null, submissions: [] };
  }

  return {
    weekStart: iso,
    label: formatVotingWeekLabel(nextWeekStart),
    submissions,
  };
}

function getNextDayOfWeek(date: Date, dayOfWeek: number) {
  const resultDate = new Date(date.getTime());
  resultDate.setDate(date.getDate() + ((7 + dayOfWeek - date.getDay()) % 7 || 7));
  resultDate.setHours(9, 0, 0, 0);
  return resultDate;
}

export async function resolveVotingWeek(weekStart: Date): Promise<{
  success: boolean;
  message?: string;
}> {
  const normalized = getWeekStart(weekStart);
  const submissions = await CampaignSubmissionModel.find({
    status: 'voting',
    votingStartDate: { $gte: normalized, $lt: getWeekEnd(normalized) },
  }).sort({ votes: -1, createdAt: 1 });

  if (submissions.length === 0) {
    return { success: false, message: 'No voting submissions for this week' };
  }

  const winner = submissions[0];
  const losers = submissions.slice(1);
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

  await setVotingWeekStatus(normalized, 'ended');

  return { success: true };
}

export async function assertSubmissionWeekIsOpen(submissionId: string): Promise<{
  ok: true;
  weekStart: Date;
} | {
  ok: false;
  error: string;
}> {
  const submission = await CampaignSubmissionModel.findById(submissionId).select('votingStartDate status');
  if (!submission || submission.status !== 'voting') {
    return { ok: false, error: 'Submission not found' };
  }
  if (!submission.votingStartDate) {
    return { ok: false, error: 'This submission is not assigned to a voting week' };
  }

  const weekStart = getWeekStart(submission.votingStartDate);
  const status = await getVotingWeekStatusForDate(weekStart);
  if (status !== 'open') {
    return { ok: false, error: 'Voting is not open for this week' };
  }

  return { ok: true, weekStart };
}
