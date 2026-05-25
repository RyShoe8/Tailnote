import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { verifyGmailOAuthState } from '@/lib/gmailOAuthState';
import { encryptSecret } from '@/lib/secretCrypto';
import {
  exchangeAuthorizationCode,
  fetchGoogleProfileEmail,
  fetchPrimarySendAsEmail,
} from '@/lib/gmailApi';
import { GmailIntegrationModel } from '@/models/GmailIntegration';
import { canonicalSessionUserId } from '@/lib/integrations/gmailIntegration';

function signatureRedirect(base: string, params: Record<string, string>): NextResponse {
  const sp = new URLSearchParams(params);
  return NextResponse.redirect(new URL(`/dashboard/signature?${sp.toString()}`, base));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const err = searchParams.get('error');

  const base = new URL(request.url).origin;

  if (err) {
    return signatureRedirect(base, { gmail: 'error', message: err, tab: 'install' });
  }
  if (!code || !state) {
    return signatureRedirect(base, { gmail: 'error', message: 'missing_code', tab: 'install' });
  }

  const payload = verifyGmailOAuthState(state);
  if (!payload) {
    return signatureRedirect(base, { gmail: 'error', message: 'invalid_state', tab: 'install' });
  }

  try {
    const tokens = await exchangeAuthorizationCode(code);
    if (!tokens.refresh_token) {
      return signatureRedirect(base, {
        gmail: 'error',
        message: 'No refresh token — revoke Tailnote in Google Account permissions and try again.',
        tab: 'install',
      });
    }

    let googleEmail = await fetchPrimarySendAsEmail(tokens.refresh_token);
    if (!googleEmail) {
      googleEmail = await fetchGoogleProfileEmail(tokens.access_token);
    }
    if (!googleEmail.trim()) {
      return signatureRedirect(base, {
        gmail: 'error',
        message: 'Could not resolve Gmail address for this account.',
        tab: 'install',
      });
    }

    const sessionUserId = canonicalSessionUserId(payload.userId);
    if (!sessionUserId) {
      return signatureRedirect(base, { gmail: 'error', message: 'invalid_user', tab: 'install' });
    }

    await connectMongoose();
    await GmailIntegrationModel.findOneAndUpdate(
      { userId: sessionUserId },
      {
        userId: sessionUserId,
        encryptedRefreshToken: encryptSecret(tokens.refresh_token),
        googleEmail: googleEmail.trim(),
      },
      { upsert: true, new: true }
    );

    return signatureRedirect(base, { gmail: 'connected', tab: 'install' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'oauth_failed';
    return signatureRedirect(base, { gmail: 'error', message: msg, tab: 'install' });
  }
}
