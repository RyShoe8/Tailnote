import { getAppBaseUrl } from '@/lib/email/appUrl';

export type SignatureInstallEmailParams = {
  signatureHtml: string;
  forwardNote?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildSignatureInstallEmail(params: SignatureInstallEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const baseUrl = getAppBaseUrl();
  const logoUrl = `${baseUrl}/images/tailnote-logo.png`;
  const subject = 'Your Tailnote signature — install on desktop';

  const forwardBlock = params.forwardNote
    ? `\n\n${params.forwardNote}`
    : '';

  const text = [
    'Your Tailnote email signature is below.',
    '',
    'Install on a desktop or laptop:',
    '• Gmail: Settings → General → scroll to Signature → paste → Save changes',
    '• Outlook: Outlook on the web or Outlook desktop → Email signature → paste',
    '',
    'On your phone: after web setup, turn off Mobile signature in the Gmail app (or leave it blank) so the app uses your full web signature.',
    forwardBlock,
    '',
    'Open Tailnote: ' + baseUrl + '/dashboard/signature',
  ]
    .filter(Boolean)
    .join('\n');

  const forwardHtml = params.forwardNote
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3f3f46;">${escapeHtml(params.forwardNote)}</p>`
    : '';

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
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background-color:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
          <tr>
            <td style="padding:24px 32px;text-align:center;border-bottom:1px solid #f4f4f5;">
              <img src="${logoUrl}" alt="Tailnote" width="120" style="display:block;margin:0 auto;max-width:120px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#18181b;">Install on a desktop or laptop</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">
                Gmail and Outlook on phones cannot accept rich HTML signatures. Open this email on your computer,
                select the signature below, copy it, and paste into your email settings.
              </p>
              ${forwardHtml}
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#18181b;">Gmail</p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3f3f46;">
                Settings → General → Signature → paste → Save changes at the bottom of the page.
              </p>
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#18181b;">Outlook</p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#3f3f46;">
                Outlook on the web or Outlook desktop (Windows) → Email signature → paste.
              </p>
              <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#18181b;">Your signature (copy from here)</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <div style="border:1px solid #e4e4e7;border-radius:8px;padding:16px;background:#fafafa;">
                ${params.signatureHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;font-size:13px;line-height:1.5;color:#71717a;">
                After installing on desktop, your signature can appear on mobile when you compose. In Gmail, disable
                Mobile signature so the app uses your web signature.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
