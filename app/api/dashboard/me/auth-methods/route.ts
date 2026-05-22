import { NextResponse } from 'next/server';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

type AccountRow = {
  providerId?: string;
};

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectMongoose();
  const db = getMongoDb();
  const accounts = (await db
    .collection('account')
    .find({ userId: session.user.id })
    .project({ providerId: 1 })
    .toArray()) as AccountRow[];

  const providers = accounts
    .map((a) => String(a.providerId ?? '').toLowerCase())
    .filter(Boolean);

  const hasGoogle = providers.includes('google');
  const hasPassword = providers.some((p) => p === 'credential' || p === 'email' || p === 'password');

  const googleOAuthConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return NextResponse.json({
    email: session.user.email ?? '',
    hasGoogle,
    hasPassword,
    googleOAuthConfigured,
  });
}
