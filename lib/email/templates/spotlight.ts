import { formatVotingWeekLabel, getWeekStart } from '@/lib/campaigns/votingWeekUtils';
import { getAppBaseUrl } from '@/lib/email/appUrl';
import type { CampaignSubmissionDoc } from '@/models/CampaignSubmission';

function spotlightUrls() {
  const baseUrl = getAppBaseUrl();
  return {
    editApply: `${baseUrl}/dashboard/spotlight/apply`,
    dashboard: `${baseUrl}/dashboard/spotlight`,
    vote: `${baseUrl}/spotlight/vote`,
    hallOfFame: `${baseUrl}/spotlight/winners`,
  };
}

export function buildSpotlightApprovedEmail(submission: CampaignSubmissionDoc) {
  const platforms = submission.socialPlatforms?.length
    ? submission.socialPlatforms.join(', ')
    : 'your requested platforms';

  const subject = `You're approved! Welcome to the Tailnote Spotlight`;
  const text = `Hi ${submission.founder},

Great news! Your submission for Tailnote Spotlight has been approved.

We are currently generating the assets for your feature. In the coming weeks, we will publish your spotlight on ${platforms}.

We will follow up when your assets are ready to go live!

Best,
The Tailnote Team
`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You're approved! 🎉</h2>
      <p>Hi ${submission.founder},</p>
      <p>Great news! Your submission for Tailnote Spotlight has been approved.</p>
      <p>We are currently generating the assets for your feature. In the coming weeks, we will publish your spotlight on <strong>${platforms}</strong>.</p>
      <p>We will follow up when your assets are ready to go live!</p>
      <br/>
      <p>Best,<br/>The Tailnote Team</p>
    </div>
  `;

  return { subject, text, html };
}

export function buildSpotlightNeedsChangesEmail(submission: CampaignSubmissionDoc, notes?: string) {
  const { editApply: editUrl } = spotlightUrls();
  const subject = `Update required for your Tailnote Spotlight application`;
  const notesText = notes ? `\nReviewer Notes:\n${notes}\n` : '';
  const notesHtml = notes
    ? `<div style="background: #fff7ed; padding: 12px; border-left: 4px solid #f97316; margin: 16px 0;"><strong>Reviewer Notes:</strong><br/>${notes}</div>`
    : '';

  const text = `Hi ${submission.founder},

Thanks for applying to Tailnote Spotlight! We're excited about your application, but we need a few changes before we can move forward.
${notesText}
Edit and resubmit your application here: ${editUrl}

Best,
The Tailnote Team
`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Update required for your application</h2>
      <p>Hi ${submission.founder},</p>
      <p>Thanks for applying to Tailnote Spotlight! We're excited about your application, but we need a few changes before we can move forward.</p>
      ${notesHtml}
      <p><a href="${editUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Edit your application</a></p>
      <br/>
      <p>Best,<br/>The Tailnote Team</p>
    </div>
  `;

  return { subject, text, html };
}

export function buildSpotlightRejectedEmail(submission: CampaignSubmissionDoc, notes?: string) {
  const subject = `Update on your Tailnote Spotlight application`;
  const notesText = notes ? `\nFeedback:\n${notes}\n` : '';
  const notesHtml = notes
    ? `<div style="background: #f4f4f5; padding: 12px; border-left: 4px solid #6b7280; margin: 16px 0;"><strong>Feedback:</strong><br/>${notes}</div>`
    : '';

  const text = `Hi ${submission.founder},

Thank you for your interest in Tailnote Spotlight. Unfortunately, we aren't able to feature your submission at this time. We receive many applications and can only feature a select few.
${notesText}
We wish you the best of luck with ${submission.companyName}!

Best,
The Tailnote Team
`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Update on your application</h2>
      <p>Hi ${submission.founder},</p>
      <p>Thank you for your interest in Tailnote Spotlight. Unfortunately, we aren't able to feature your submission at this time. We receive many applications and can only feature a select few.</p>
      ${notesHtml}
      <p>We wish you the best of luck with ${submission.companyName}!</p>
      <br/>
      <p>Best,<br/>The Tailnote Team</p>
    </div>
  `;

  return { subject, text, html };
}

export function buildSpotlightVotingEmail(submission: CampaignSubmissionDoc, votingStartDate?: Date) {
  const { vote: voteUrl, dashboard: dashboardUrl } = spotlightUrls();
  const subject = `You're scheduled for Spotlight voting week`;

  const weekLabel = votingStartDate
    ? formatVotingWeekLabel(getWeekStart(votingStartDate))
    : 'an upcoming Spotlight community vote week';

  const weekIntroHtml = votingStartDate
    ? `You are scheduled for <strong>${weekLabel}</strong>.`
    : 'You are scheduled for an upcoming Spotlight community vote week.';

  const weekIntroPlain = votingStartDate
    ? `You are scheduled for ${weekLabel}.`
    : 'You are scheduled for an upcoming Spotlight community vote week.';

  const nextStepsHtml = `
    <ul style="padding-left: 20px; line-height: 1.6;">
      <li>Community voting opens that week on our <a href="${voteUrl}">public vote page</a>.</li>
      <li>Share the vote link with your network to gather support for ${submission.companyName}.</li>
      <li>The vote winner is featured on Tuesday; all entrants are featured on Thursday.</li>
      <li>Track your status anytime on your <a href="${dashboardUrl}">Spotlight dashboard</a>.</li>
    </ul>
  `;

  const nextStepsPlain = [
    `Community voting opens that week: ${voteUrl}`,
    'Share the vote link with your network to gather support.',
    'The vote winner is featured on Tuesday; all entrants are featured on Thursday.',
    `Track your status: ${dashboardUrl}`,
  ].join('\n');

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You're scheduled for voting week</h2>
      <p>Hi ${submission.founder},</p>
      <p>Great news! Your Tailnote Spotlight application has been approved. ${weekIntroHtml}</p>
      <p><strong>What happens next</strong></p>
      ${nextStepsHtml}
      <p style="margin-top: 20px;">
        <a href="${voteUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Share the vote page</a>
      </p>
      <p style="margin-top: 16px;">
        <a href="${dashboardUrl}">View your Spotlight dashboard</a>
      </p>
      <br/>
      <p>Good luck!<br/>The Tailnote Team</p>
    </div>
  `;

  const text = `Hi ${submission.founder},

Great news! Your Tailnote Spotlight application has been approved. ${weekIntroPlain}

What happens next:
${nextStepsPlain}

Share the vote page: ${voteUrl}

Good luck!
The Tailnote Team`;

  return { subject, text, html };
}

export function buildSpotlightHallOfFameEmail(submission: CampaignSubmissionDoc) {
  const { hallOfFame: hallOfFameUrl } = spotlightUrls();
  const subject = `Welcome to the Tailnote Spotlight Hall of Fame`;

  const text = `Hi ${submission.founder},

Congratulations! ${submission.companyName} has been added to the Tailnote Spotlight Hall of Fame.

View your feature: ${hallOfFameUrl}

Best,
The Tailnote Team
`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to the Hall of Fame</h2>
      <p>Hi ${submission.founder},</p>
      <p>Congratulations! <strong>${submission.companyName}</strong> has been added to the Tailnote Spotlight Hall of Fame.</p>
      <p><a href="${hallOfFameUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">View the Hall of Fame</a></p>
      <br/>
      <p>Best,<br/>The Tailnote Team</p>
    </div>
  `;

  return { subject, text, html };
}
