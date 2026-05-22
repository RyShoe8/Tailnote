import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { decryptSecret } from '@/lib/secretCrypto';
import { patchGmailSignature } from '@/lib/gmailApi';
import { OrganizationModel } from '@/models/Organization';
import { assertOrganizationSubscriptionPaid } from '@/lib/dashboard/subscriptionRequired';
import { GmailIntegrationModel } from '@/models/GmailIntegration';

const BodySchema = z.object({
  html: z.string().min(1).max(900_000),
  applyToReplies: z.boolean().optional(),
});

type SessionUser = {
  id?: string;
  organizationId?: string;
};

export async function POST(request: Request) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: 'Gmail integration is not configured' }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(' ') }, { status: 400 });
  }

  await connectMongoose();

  if (user.organizationId) {
    const org = await OrganizationModel.findById(user.organizationId);
    const subErr = assertOrganizationSubscriptionPaid(org);
    if (subErr) return subErr;
  }

  const row = await GmailIntegrationModel.findOne({ userId: user.id }).lean();
  if (!row?.encryptedRefreshToken) {
    return NextResponse.json({ error: 'Gmail is not connected' }, { status: 400 });
  }

  let refreshToken: string;
  try {
    refreshToken = decryptSecret(row.encryptedRefreshToken);
  } catch {
    return NextResponse.json({ error: 'Stored credentials are invalid' }, { status: 500 });
  }

  const applyToReplies = parsed.data.applyToReplies !== false;

  try {
    const { sendAsEmail } = await patchGmailSignature(refreshToken, parsed.data.html);
    await GmailIntegrationModel.updateOne(
      { userId: user.id },
      { $set: { applyToReplies } }
    );
    return NextResponse.json({ ok: true, sendAsEmail, applyToReplies });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'apply_failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
