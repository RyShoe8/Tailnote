import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { logError } from '@/lib/logger';
import {
  CreateOrganizationUserInviteError,
  createOrganizationUserInvite,
} from '@/lib/admin/createOrganizationUserInvite';
import { listPendingOrganizationUserInvites } from '@/lib/admin/listPendingOrganizationUserInvites';
import { isValidObjectIdString, listUsersInOrganization } from '@/lib/admin/data';
import { OrganizationModel } from '@/models/Organization';
import { connectMongoose } from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

const PostSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(120),
  role: z.enum(['owner', 'admin', 'member']),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectIdString(id)) {
    return NextResponse.json({ error: 'Invalid organization id' }, { status: 400 });
  }
  await connectMongoose();
  const org = await OrganizationModel.findById(id);
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  const [users, pendingInvites] = await Promise.all([
    listUsersInOrganization(id),
    listPendingOrganizationUserInvites(id),
  ]);
  return NextResponse.json({
    organizationId: id,
    organizationName: org.name,
    users,
    pendingInvites,
  });
}

export async function POST(request: Request, { params }: RouteParams) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectIdString(id)) {
    return NextResponse.json({ error: 'Invalid organization id' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = PostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(' ') },
      { status: 400 }
    );
  }

  try {
    const invite = await createOrganizationUserInvite({
      organizationId: id,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
    });
    return NextResponse.json(
      {
        inviteSent: true,
        invite,
        message: 'Invitation email sent.',
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof CreateOrganizationUserInviteError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logError('api/admin/organizations/[id]/users', err);
    return NextResponse.json({ error: 'Could not send invitation' }, { status: 500 });
  }
}
