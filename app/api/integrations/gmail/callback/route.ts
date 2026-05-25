import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { verifyGmailOAuthState } from '@/lib/gmailOAuthState';
import { encryptSecret } from '@/lib/secretCrypto';
import { exchangeAuthorizationCode, fetchGoogleProfileEmail } from '@/lib/gmailApi';
import { GmailIntegrationModel } from '@/models/GmailIntegration';
import { canonicalSessionUserId } from '@/lib/integrations/gmailIntegration';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const err = searchParams.get('error');

  const base = new URL(request.url).origin;

  if (err) {
    return NextResponse.redirect(new URL(`/dashboard/signature?gmail=error&message=${encodeURIComponent(err)}`, base));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard/signature?gmail=error&message=missing_code', base));
  }

  const payload = verifyGmailOAuthState(state);
  if (!payload) {
    return NextResponse.redirect(new URL('/dashboard/signature?gmail=error&message=invalid_state', base));
  }

  try {
    const tokens = await exchangeAuthorizationCode(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL(
          '/dashboard/signature?gmail=error&message=' +
            encodeURIComponent('No refresh token — revoke Tailnote in Google Account permissions and try again.'),
          base
        )
      );
    }

    const googleEmail = await fetchGoogleProfileEmail(tokens.access_token);

    const sessionUserId = canonicalSessionUserId(payload.userId);
    if (!sessionUserId) {
      return NextResponse.redirect(new URL('/dashboard/signature?gmail=error&message=invalid_user', base));
    }

    await connectMongoose();
    await GmailIntegrationModel.findOneAndUpdate(
      { userId: sessionUserId },
      {
        userId: sessionUserId,
        encryptedRefreshToken: encryptSecret(tokens.refresh_token),
        googleEmail,
      },
      { upsert: true, new: true }
    );

    return NextResponse.redirect(new URL('/dashboard/signature?gmail=connected', base));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'oauth_failed';
    return NextResponse.redirect(new URL(`/dashboard/signature?gmail=error&message=${encodeURIComponent(msg)}`, base));
  }
}
