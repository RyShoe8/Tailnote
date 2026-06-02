import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { resolveViewerEmployeeId } from '@/lib/analytics/resolveViewerEmployee';
import { SignatureCopyEventModel } from '@/models/SignatureCopyEvent';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  method: z.enum(['html', 'text']).default('html'),
});

type SessionUser = {
  id?: string;
  organizationId?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as SessionUser;
  if (!user.organizationId || !user.id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // fallback to default method
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  await connectMongoose();
  let employeeId: mongoose.Types.ObjectId | undefined;
  try {
    employeeId = (await resolveViewerEmployeeId({
      organizationId: user.organizationId,
      userId: user.id,
    })) ?? undefined;
  } catch {
    // Best effort: copy tracking should still work even if employee resolve fails.
  }

  try {
    await SignatureCopyEventModel.create({
      organizationId: new mongoose.Types.ObjectId(user.organizationId),
      employeeId,
      method: parsed.data.method,
      userAgent: request.headers.get('user-agent')?.slice(0, 500) || '',
      referer: request.headers.get('referer')?.slice(0, 500) || '',
    });
  } catch {
    return NextResponse.json({ error: 'Could not track copy' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
