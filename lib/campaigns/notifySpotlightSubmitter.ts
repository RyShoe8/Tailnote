import type { CampaignSubmissionDoc } from '@/models/CampaignSubmission';
import { getSubmitterEmail } from '@/lib/campaigns/getSubmitterEmail';
import { sendEmail } from '@/lib/email/mail';

export type SpotlightEmailContent = {
  subject: string;
  html: string;
  text: string;
};

export type NotifySpotlightSubmitterResult =
  | { ok: true }
  | { ok: false; error: string; code: 'no_email' | 'send_failed' };

export async function notifySpotlightSubmitter(
  userId: string,
  buildContent: (submission: CampaignSubmissionDoc) => SpotlightEmailContent,
  submission: CampaignSubmissionDoc,
): Promise<NotifySpotlightSubmitterResult> {
  const email = await getSubmitterEmail(userId);
  if (!email) {
    console.error('[Tailnote] Spotlight email skipped: no submitter email for userId', userId);
    return { ok: false, error: 'Could not find submitter email address.', code: 'no_email' };
  }

  const { subject, html, text } = buildContent(submission);
  const result = await sendEmail({ to: email, subject, html, text });

  if (!result.ok) {
    console.error('[Tailnote] Spotlight email failed:', result.error, { userId, subject });
    return { ok: false, error: result.error, code: 'send_failed' };
  }

  return { ok: true };
}

export function spotlightEmailWarningMessage(notify: NotifySpotlightSubmitterResult): string | undefined {
  if (notify.ok) return undefined;
  if (notify.code === 'no_email') {
    return 'Status updated, but we could not find the applicant email address.';
  }
  return `Status updated, but the notification email failed to send: ${notify.error}`;
}
