import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  DeleteOrganizationUserError,
  deleteOrganizationUser,
} from '@/lib/admin/deleteOrganizationUser';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { logError } from '@/lib/logger';
import { AUTH_USER_COLLECTION, authUserDbFilterBySessionId } from '@/lib/auth/platformAdmin';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']).optional(),
  platformAdmin: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const { id: targetUserId } = await params;
  if (!targetUserId?.trim()) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(' ') }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const filter = authUserDbFilterBySessionId(targetUserId);
  if (!filter) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  await connectMongoose();
  const db = getMongoDb();
  const $set: Record<string, unknown> = {};
  if (parsed.data.role !== undefined) $set.role = parsed.data.role;
  if (parsed.data.platformAdmin !== undefined) $set.platformAdmin = parsed.data.platformAdmin;

  const result = await db.collection(AUTH_USER_COLLECTION).updateOne(filter, { $set });
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const user = await db.collection(AUTH_USER_COLLECTION).findOne(filter);
  return NextResponse.json({ user });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const { id: targetUserId } = await params;
  if (!targetUserId?.trim()) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  try {
    await deleteOrganizationUser(targetUserId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof DeleteOrganizationUserError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logError('api/admin/users/[id]', err);
    return NextResponse.json({ error: 'Could not delete user' }, { status: 500 });
  }
}
