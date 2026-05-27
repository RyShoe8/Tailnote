import { connectMongoose } from '@/lib/mongoose';
import { OrganizationUserInviteModel } from '@/models/OrganizationUserInvite';

export type PendingOrganizationUserInviteRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  inviteSentAt: string | null;
};

export async function listPendingOrganizationUserInvites(
  organizationId: string
): Promise<PendingOrganizationUserInviteRow[]> {
  await connectMongoose();
  const rows = await OrganizationUserInviteModel.find({
    organizationId,
    acceptedAt: null,
  })
    .sort({ inviteSentAt: -1, createdAt: -1 })
    .lean();

  return rows.map((r) => ({
    id: String(r._id),
    email: String(r.email),
    name: String(r.name ?? ''),
    role: String(r.role),
    inviteSentAt: r.inviteSentAt ? new Date(r.inviteSentAt).toISOString() : null,
  }));
}
