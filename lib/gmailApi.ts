import { google, gmail_v1 } from 'googleapis';
import {
  assertGmailSignatureWithinLimit,
  prepareSignatureHtmlForGmail,
} from '@/lib/email/gmailSignatureHtml';

function gmailApiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { error?: { message?: string } } } }).response?.data;
    const apiMsg = data?.error?.message;
    if (typeof apiMsg === 'string' && apiMsg.trim()) return apiMsg.trim();
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return 'Could not update Gmail signature';
}

function getGoogleOAuthCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured');
  }
  return { clientId, clientSecret };
}

function createGmailClient(refreshToken: string): gmail_v1.Gmail {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, getGoogleRedirectUri());
  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: 'v1', auth: oauth2 });
}

function pickPrimarySendAsEmail(entries: gmail_v1.Schema$SendAs[]): string {
  const pick =
    entries.find((s) => s.isPrimary) || entries.find((s) => s.isDefault) || entries[0];
  return (pick?.sendAsEmail || '').trim();
}

export function getGoogleRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI?.trim()) {
    return process.env.GOOGLE_REDIRECT_URI.trim();
  }
  const base = (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  return `${base}/api/integrations/gmail/callback`;
}

export async function exchangeAuthorizationCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getGoogleRedirectUri(),
    grant_type: 'authorization_code',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(typeof json.error_description === 'string' ? json.error_description : 'Token exchange failed');
  }
  return json as { access_token: string; refresh_token?: string; expires_in?: number };
}

export async function fetchGoogleProfileEmail(accessToken: string): Promise<string> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return '';
  const json = (await res.json()) as { email?: string };
  return (json.email || '').trim();
}

/** Primary send-as address for the linked Gmail account (works with gmail.settings.basic scope). */
export async function fetchPrimarySendAsEmail(refreshToken: string): Promise<string> {
  const gmail = createGmailClient(refreshToken);
  const list = await gmail.users.settings.sendAs.list({ userId: 'me' });
  return pickPrimarySendAsEmail(list.data.sendAs || []);
}

export async function patchGmailSignature(refreshToken: string, html: string): Promise<{ sendAsEmail: string }> {
  const gmail = createGmailClient(refreshToken);
  const list = await gmail.users.settings.sendAs.list({ userId: 'me' });
  const sendAsEmail = pickPrimarySendAsEmail(list.data.sendAs || []);
  if (!sendAsEmail) {
    throw new Error('No send-as identity found for this Gmail account');
  }

  const prepared = prepareSignatureHtmlForGmail(html);
  assertGmailSignatureWithinLimit(prepared);

  try {
    await gmail.users.settings.sendAs.patch({
      userId: 'me',
      sendAsEmail,
      requestBody: { signature: prepared },
    });
  } catch (err) {
    throw new Error(gmailApiErrorMessage(err));
  }

  return { sendAsEmail };
}
