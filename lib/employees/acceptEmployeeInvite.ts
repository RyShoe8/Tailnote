import { headers } from 'next/headers';
import { connectMongoose } from '@/lib/mongoose';
import { getAuth } from '@/lib/auth/server';
import { EmployeeModel } from '@/models/Employee';
import { OrganizationModel } from '@/models/Organization';
import { isInviteExpired } from '@/lib/employees/inviteToken';
import { orgPermissionFlags } from '@/lib/org/permissions';
import { getOrgOwnerPromoBlocks } from '@/lib/org/getOrgOwnerPromoBlocks';

export type AcceptInviteResult =
  | { ok: true; redirect: string }
  | { ok: false; error: string; status: number };

export async function acceptEmployeeInvite(
  inviteToken: string,
  sessionUser: { id: string; email: string; organizationId?: string | null }
): Promise<AcceptInviteResult> {
  await connectMongoose();

  const employee = await EmployeeModel.findOne({ inviteToken });
  if (!employee) {
    return { ok: false, error: 'Invalid invitation', status: 404 };
  }

  if (employee.inviteAcceptedAt) {
    if (
      sessionUser.organizationId &&
      String(sessionUser.organizationId) === String(employee.organizationId)
    ) {
      return { ok: true, redirect: '/dashboard/signature' };
    }
    return { ok: false, error: 'This invitation has already been accepted', status: 400 };
  }

  if (isInviteExpired(employee.inviteExpiresAt)) {
    return { ok: false, error: 'This invitation has expired', status: 410 };
  }

  const sessionEmail = sessionUser.email.trim().toLowerCase();
  if (sessionEmail !== employee.email) {
    return {
      ok: false,
      error: 'Sign in with the email address that received this invitation',
      status: 403,
    };
  }

  if (
    sessionUser.organizationId &&
    String(sessionUser.organizationId) !== String(employee.organizationId)
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
      organizationId: employee.organizationId.toString(),
      role: 'member',
    } as never,
    headers: await headers(),
  });

  const org = await OrganizationModel.findById(employee.organizationId).lean();
  const flags = org ? orgPermissionFlags(org as Record<string, unknown>) : null;
  if (flags && !flags.employeesCanEditPromoBlocks) {
    const ownerBlocks = await getOrgOwnerPromoBlocks(employee.organizationId);
    employee.contentBlocks = ownerBlocks as never;
    employee.promoBlocksCustomized = false;
  }

  employee.inviteAcceptedAt = new Date();
  employee.userId = sessionUser.id;
  await employee.save();

  return { ok: true, redirect: '/dashboard/signature' };
}
