import { connectMongoose } from '@/lib/mongoose';
import { isInviteExpired } from '@/lib/employees/inviteToken';
import { OrganizationUserInviteModel } from '@/models/OrganizationUserInvite';
import { OrganizationModel, type OrganizationDoc } from '@/models/Organization';

export type OrganizationUserInviteInfo = {
  orgName: string;
  email: string;
  name: string;
  role: string;
  alreadyAccepted: boolean;
  expired: boolean;
};

export async function getOrganizationUserInviteInfo(
  inviteToken: string
): Promise<OrganizationUserInviteInfo | null> {
  await connectMongoose();
  const invite = await OrganizationUserInviteModel.findOne({ inviteToken }).lean();
  if (!invite) return null;

  const org = await OrganizationModel.findById(invite.organizationId).lean<OrganizationDoc | null>();
  if (!org) return null;
  const orgName = org?.companyName?.trim() || org?.name?.trim() || 'your team';

  return {
    orgName,
    email: String(invite.email),
    name: String(invite.name ?? ''),
    role: String(invite.role),
    alreadyAccepted: Boolean(invite.acceptedAt),
    expired: !invite.acceptedAt && isInviteExpired(invite.inviteExpiresAt),
  };
}
