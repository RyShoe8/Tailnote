import type { CampaignSubmissionDoc } from '@/models/CampaignSubmission';

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
  const editUrl = 'https://tailnote.com/dashboard/spotlight/apply';
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
  const voteUrl = 'https://tailnote.com/spotlight/vote';
  const subject = `You're approved for Spotlight voting week`;

  let dateTextHtml = 'for an upcoming Spotlight community vote week.';
  let dateTextPlain = 'for an upcoming Spotlight community vote week.';

  if (votingStartDate) {
    const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(votingStartDate);
    dateTextHtml = `for the Spotlight community vote week starting <strong>${formattedDate}</strong>.`;
    dateTextPlain = `for the Spotlight community vote week starting ${formattedDate}.`;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You're approved for voting week</h2>
      <p>Hi ${submission.founder},</p>
      <p>Great news! Your application has been approved ${dateTextHtml}</p>
      <p>To win the top spot and get featured on Tuesday, you'll need the most community votes.</p>
      <p><a href="${voteUrl}">Share this link and get your community to vote for you!</a></p>
      <p>Even if you don't win, you are guaranteed to be featured as a runner-up on Thursday.</p>
      <br/>
      <p>Good luck!</p>
      <p>The Tailnote Team</p>
    </div>
  `;

  const text = `Hi ${submission.founder},\n\nGreat news! Your application has been approved ${dateTextPlain}\n\nTo win the top spot and get featured on Tuesday, you'll need the most community votes. Share this link to get your community to vote for you: ${voteUrl}\n\nEven if you don't win, you are guaranteed to be featured as a runner-up on Thursday.\n\nGood luck!\nThe Tailnote Team`;

  return { subject, text, html };
}

export function buildSpotlightHallOfFameEmail(submission: CampaignSubmissionDoc) {
  const hallOfFameUrl = 'https://tailnote.com/spotlight/winners';
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
      <p><a href="${hallOfFameUrl}">View the Hall of Fame</a></p>
      <br/>
      <p>Best,<br/>The Tailnote Team</p>
    </div>
  `;

  return { subject, text, html };
}
