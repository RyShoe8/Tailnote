import {
  AUTH_USER_COLLECTION,
  authUserDbFilterBySessionId,
} from '@/lib/auth/platformAdmin';
import { purgeOrganizationUserAuth } from '@/lib/admin/purgeOrganizationUserAuth';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';

export class DeleteOrganizationUserError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'DeleteOrganizationUserError';
  }
}

type AuthUserDoc = {
  _id?: unknown;
  id?: string;
  organizationId?: string;
  role?: string;
};

export async function deleteOrganizationUser(userId: string): Promise<void> {
  const filter = authUserDbFilterBySessionId(userId);
  if (!filter) {
    throw new DeleteOrganizationUserError('Invalid user id', 400);
  }

  await connectMongoose();
  const db = getMongoDb();
  const user = await db.collection<AuthUserDoc>(AUTH_USER_COLLECTION).findOne(filter);
  if (!user) {
    throw new DeleteOrganizationUserError('User not found', 404);
  }

  const orgId = String(user.organizationId ?? '').trim();
  const role = String(user.role ?? '');
  if (role === 'owner' && orgId) {
    const ownerCount = await db.collection(AUTH_USER_COLLECTION).countDocuments({
      organizationId: orgId,
      role: 'owner',
    });
    if (ownerCount <= 1) {
      throw new DeleteOrganizationUserError(
        'Cannot delete the sole owner of an organization',
        409
      );
    }
  }

  await purgeOrganizationUserAuth(userId);
}
