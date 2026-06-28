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
  const subject = `Update required for your Tailnote Spotlight application`;
  const notesText = notes ? `\nReviewer Notes:\n${notes}\n` : '';
  const notesHtml = notes
    ? `<div style="background: #f4f4f5; padding: 12px; border-left: 4px solid #3b82f6; margin: 16px 0;"><strong>Reviewer Notes:</strong><br/>${notes}</div>`
    : '';

  const text = `Hi ${submission.founder},

Thanks for applying to Tailnote Spotlight! We're excited about your application, but we need a few changes before we can approve it.
${notesText}
Please log in to your dashboard to review your submission and make the necessary updates.

Best,
The Tailnote Team
`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Update required for your application</h2>
      <p>Hi ${submission.founder},</p>
      <p>Thanks for applying to Tailnote Spotlight! We're excited about your application, but we need a few changes before we can approve it.</p>
      ${notesHtml}
      <p>Please log in to your dashboard to review your submission and make the necessary updates.</p>
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

export function buildSpotlightVotingEmail(submission: CampaignSubmissionDoc) {
  const loginUrl = 'https://tailnote.com/spotlight/vote';
  const subject = `You're up for a vote! Spotlight 🌟`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You're up for a vote! 🌟</h2>
      <p>Hi ${submission.founder},</p>
      <p>Great news! Your quote has been selected for this week's Spotlight community vote.</p>
      <p>To win the top spot and get featured on Tuesday, you'll need the most community votes.</p>
      <p><a href="${loginUrl}">Share this link and get your community to vote for you!</a></p>
      <p>Even if you don't win, you are guaranteed to be featured as a runner-up on Thursday.</p>
      <br/>
      <p>Good luck!</p>
      <p>The Tailnote Team</p>
    </div>
  `;

  const text = `Hi ${submission.founder},\n\nGreat news! Your quote has been selected for this week's Spotlight community vote.\n\nTo win the top spot and get featured on Tuesday, you'll need the most community votes. Share this link to get your community to vote for you: ${loginUrl}\n\nEven if you don't win, you are guaranteed to be featured as a runner-up on Thursday.\n\nGood luck!\nThe Tailnote Team`;

  return { subject, text, html };
}
