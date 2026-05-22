import mongoose from 'mongoose';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';

export type OrgOwnerUser = {
  id: string;
  email: string;
  name?: string | null;
};

/** Better Auth user document for the organization owner. */
export async function getOrgOwnerUser(
  organizationId: mongoose.Types.ObjectId | string
): Promise<OrgOwnerUser | null> {
  await connectMongoose();
  const orgId = String(organizationId);
  const db = getMongoDb();
  const row = await db.collection('user').findOne({
    organizationId: orgId,
    role: 'owner',
  });
  if (!row) return null;
  const id = String((row as { id?: string; _id?: mongoose.Types.ObjectId }).id ?? (row as { _id?: mongoose.Types.ObjectId })._id ?? '');
  const email = String((row as { email?: string }).email ?? '').trim().toLowerCase();
  if (!id || !email) return null;
  return {
    id,
    email,
    name: (row as { name?: string | null }).name ?? null,
  };
}
