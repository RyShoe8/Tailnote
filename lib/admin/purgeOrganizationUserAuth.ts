import { accountFilterBySessionUserId } from '@/lib/auth/accountQueries';
import {
  AUTH_USER_COLLECTION,
  authUserDbFilterBySessionId,
} from '@/lib/auth/platformAdmin';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { UserSignatureProfileModel } from '@/models/UserSignatureProfile';

type AuthUserDoc = {
  _id?: unknown;
  id?: string;
};

function sessionFilterByUserId(userId: string) {
  return accountFilterBySessionUserId(userId);
}

/** Removes Better Auth user, linked accounts/sessions, profile, and employee rows for one user id. */
export async function purgeOrganizationUserAuth(userId: string): Promise<void> {
  const filter = authUserDbFilterBySessionId(userId);
  if (!filter) return;

  await connectMongoose();
  const db = getMongoDb();
  const user = await db.collection<AuthUserDoc>(AUTH_USER_COLLECTION).findOne(filter);
  if (!user) return;

  const uid = String(user.id ?? user._id ?? userId);
  const linkedFilter = sessionFilterByUserId(uid);

  await db.collection('account').deleteMany(linkedFilter);
  await db.collection('session').deleteMany(linkedFilter);
  await db.collection(AUTH_USER_COLLECTION).deleteOne(filter);

  await EmployeeModel.deleteMany({ userId: uid });
  await UserSignatureProfileModel.deleteMany({ userId: uid });
}
