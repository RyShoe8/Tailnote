import { getAppBaseUrl } from '@/lib/email/appUrl';

export type OrgUserInviteEmailParams = {
  orgName: string;
  inviteUrl: string;
  inviteeEmail: string;
  inviteeName: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildOrgUserInviteEmail(params: OrgUserInviteEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const baseUrl = getAppBaseUrl();
  const logoUrl = `${baseUrl}/images/tailnote-logo.png`;
  const orgName = escapeHtml(params.orgName);
  const inviteUrl = escapeHtml(params.inviteUrl);
  const inviteeEmail = escapeHtml(params.inviteeEmail);
  const inviteeName = escapeHtml(params.inviteeName);

  const subject = `You're invited to join ${params.orgName} on Tailnote`;

  const text = [
    `Hi ${params.inviteeName},`,
    '',
    `You've been invited to join ${params.orgName} on Tailnote as a workspace user.`,
    '',
    'Create your account or sign in with the invited email to accept:',
    params.inviteUrl,
    '',
    `This invite was sent to ${params.inviteeEmail}. If you weren't expecting it, you can ignore this email.`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #f4f4f5;">
              <img src="${logoUrl}" alt="Tailnote" width="140" height="auto" style="display:block;margin:0 auto;max-width:140px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#71717a;">Workspace invitation</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;line-height:1.3;color:#18181b;">Join ${orgName} on Tailnote</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">
                Hi ${inviteeName}, you've been invited to access the <strong>${orgName}</strong> workspace on Tailnote.
              </p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#3f3f46;">
                Click below to create your account or sign in, then accept the invitation.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="border-radius:8px;background-color:#18181b;">
                    <a href="${inviteUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Accept invitation</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#71717a;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:13px;line-height:1.5;word-break:break-all;">
                <a href="${inviteUrl}" style="color:#2563eb;text-decoration:underline;">${inviteUrl}</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;">
                This invitation was sent to ${inviteeEmail}. If you weren't expecting it, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa;">© Tailnote</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
