import mongoose from 'mongoose';
import { authUserDbFilterBySessionId } from '@/lib/auth/platformAdmin';
import { connectMongoose } from '@/lib/mongoose';

/** Resolve submitter email from Better Auth user id (stored as _id ObjectId). */
export async function getSubmitterEmail(userId: string): Promise<string | null> {
  await connectMongoose();
  const filter = authUserDbFilterBySessionId(userId);
  if (!filter) return null;

  const db = mongoose.connection.db;
  if (!db) return null;

  const doc = await db
    .collection('user')
    .findOne(filter, { projection: { email: 1 } });

  const email = typeof doc?.email === 'string' ? doc.email.trim() : '';
  return email || null;
}
