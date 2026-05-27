import { headers } from 'next/headers';
import { connectMongoose } from '@/lib/mongoose';
import { getAuth } from '@/lib/auth/server';
import { ensureOwnerEmployee } from '@/lib/employees/ensureOwnerEmployee';
import { isInviteExpired } from '@/lib/employees/inviteToken';
import { OrganizationUserInviteModel } from '@/models/OrganizationUserInvite';
import { OrganizationModel } from '@/models/Organization';

export type AcceptOrgUserInviteResult =
  | { ok: true; redirect: string }
  | { ok: false; error: string; status: number };

export async function acceptOrganizationUserInvite(
  inviteToken: string,
  sessionUser: { id: string; email: string; name?: string | null; organizationId?: string | null }
): Promise<AcceptOrgUserInviteResult> {
  await connectMongoose();

  const invite = await OrganizationUserInviteModel.findOne({ inviteToken });
  if (!invite) {
    return { ok: false, error: 'Invalid invitation', status: 404 };
  }

  if (invite.acceptedAt) {
    if (
      sessionUser.organizationId &&
      String(sessionUser.organizationId) === String(invite.organizationId)
    ) {
      return { ok: true, redirect: '/dashboard' };
    }
    return { ok: false, error: 'This invitation has already been accepted', status: 400 };
  }

  if (isInviteExpired(invite.inviteExpiresAt)) {
    return { ok: false, error: 'This invitation has expired', status: 410 };
  }

  const sessionEmail = sessionUser.email.trim().toLowerCase();
  if (sessionEmail !== invite.email) {
    return {
      ok: false,
      error: 'Sign in with the email address that received this invitation',
      status: 403,
    };
  }

  if (
    sessionUser.organizationId &&
    String(sessionUser.organizationId) !== String(invite.organizationId)
  ) {
    return {
      ok: false,
      error: 'Your account is already linked to another organization',
      status: 409,
    };
  }

  const auth = await getAuth();
  await auth.api.updateUser({
    body: {
      organizationId: invite.organizationId.toString(),
      role: invite.role,
      name: sessionUser.name?.trim() || invite.name,
    } as never,
    headers: await headers(),
  });

  invite.acceptedAt = new Date();
  await invite.save();

  const org = await OrganizationModel.findById(invite.organizationId);
  if (invite.role === 'owner' && org) {
    await ensureOwnerEmployee(org._id, {
      id: sessionUser.id,
      email: sessionEmail,
      name: sessionUser.name || invite.name,
    });
  }

  const redirect = invite.role === 'owner' ? '/dashboard' : '/dashboard/signature';
  return { ok: true, redirect };
}
