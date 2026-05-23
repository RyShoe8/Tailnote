import { accountFilterBySessionUserId } from '@/lib/auth/accountQueries';
import {
  AUTH_USER_COLLECTION,
  authUserDbFilterBySessionId,
} from '@/lib/auth/platformAdmin';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { GmailIntegrationModel } from '@/models/GmailIntegration';
import { UserSignatureProfileModel } from '@/models/UserSignatureProfile';

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

function sessionFilterByUserId(userId: string) {
  return accountFilterBySessionUserId(userId);
}

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

  const uid = String(user.id ?? user._id ?? userId);
  const linkedFilter = sessionFilterByUserId(uid);

  await db.collection('account').deleteMany(linkedFilter);
  await db.collection('session').deleteMany(linkedFilter);
  await db.collection(AUTH_USER_COLLECTION).deleteOne(filter);

  await EmployeeModel.deleteMany({ userId: uid });
  await UserSignatureProfileModel.deleteMany({ userId: uid });
  await GmailIntegrationModel.deleteOne({ userId: uid });
}
