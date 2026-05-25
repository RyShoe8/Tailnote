import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import {
  canonicalSessionUserId,
  deleteGmailIntegrationForSessionUser,
} from '@/lib/integrations/gmailIntegration';

type SessionUser = {
  id?: string;
};

export async function POST() {
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
  await deleteGmailIntegrationForSessionUser(sessionUserId);
  return NextResponse.json({ ok: true });
}
