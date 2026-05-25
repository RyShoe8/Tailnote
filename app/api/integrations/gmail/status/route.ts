import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { GmailIntegrationModel } from '@/models/GmailIntegration';
import {
  canonicalSessionUserId,
  findGmailIntegrationForSessionUser,
  gmailIntegrationFilterForSessionUser,
  isGmailIntegrationConnected,
} from '@/lib/integrations/gmailIntegration';

type SessionUser = {
  id?: string;
};

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  const sessionUserId = canonicalSessionUserId(user.id);
  if (!sessionUserId) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  await connectMongoose();

  const row = await findGmailIntegrationForSessionUser(sessionUserId);
  const connected = isGmailIntegrationConnected(row);
  const stale = Boolean(row && !connected);

  if (stale) {
    const filter = gmailIntegrationFilterForSessionUser(sessionUserId);
    if (filter) {
      await GmailIntegrationModel.deleteMany(filter);
    }
  }

  return NextResponse.json({
    connected,
    stale: stale || undefined,
    googleEmail: connected ? row?.googleEmail || '' : '',
    applyToReplies: connected ? row?.applyToReplies !== false : true,
  });
}
