import { getAppBaseUrl } from '@/lib/email/appUrl';

export type SubscriptionPaymentFailedEmailParams = {
  orgName: string;
  billingUrl: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildSubscriptionPaymentFailedEmail(params: SubscriptionPaymentFailedEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const baseUrl = getAppBaseUrl();
  const logoUrl = `${baseUrl}/images/tailnote-logo.png`;
  const orgName = escapeHtml(params.orgName);
  const billingUrl = escapeHtml(params.billingUrl);

  const subject = `Action required: Tailnote payment failed for ${params.orgName}`;

  const text = [
    `We could not process the latest payment for your Tailnote subscription (${params.orgName}).`,
    '',
    'Your account has been paused until payment is updated. Signature previews, tracked links, and exports are disabled until billing is resolved.',
    '',
    `Update billing: ${params.billingUrl}`,
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
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#71717a;">Billing</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;line-height:1.3;color:#18181b;">Payment failed</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">
                We could not process the latest payment for <strong>${orgName}</strong>. Your Tailnote subscription is paused until billing is updated.
              </p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#3f3f46;">
                Signature previews, tracked links, and new exports are disabled until payment succeeds.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="border-radius:8px;background-color:#18181b;">
                    <a href="${billingUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Update billing</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;">
                If you already updated your payment method, Stripe will retry automatically.
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
