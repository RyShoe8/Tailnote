/**
 * One-time maintenance: lowercase Better Auth user emails and mark credential users verified.
 * Run from repo root: npx tsx scripts/normalize-user-emails.ts
 */
import mongoose from 'mongoose';
import { connectMongoose, getMongoDb } from '../lib/mongoose';

type UserRow = {
  _id?: unknown;
  id?: string;
  email?: string;
  emailVerified?: boolean;
};

async function main() {
  await connectMongoose();
  const db = getMongoDb();
  const users = db.collection('user');
  const accounts = db.collection('account');

  const cursor = users.find({});
  let emailUpdates = 0;
  let verifiedUpdates = 0;

  while (await cursor.hasNext()) {
    const row = (await cursor.next()) as UserRow | null;
    if (!row) continue;

    const userId = String(row.id ?? row._id ?? '');
    const rawEmail = String(row.email ?? '').trim();
    const normalized = rawEmail.toLowerCase();
    if (!userId || !normalized) continue;

    const $set: Record<string, unknown> = {};
    if (rawEmail !== normalized) {
      $set.email = normalized;
      emailUpdates += 1;
    }

    const hasCredential = await accounts.findOne({
      userId,
      providerId: { $in: ['credential', 'email-password'] },
    });
    if (hasCredential && row.emailVerified !== true) {
      $set.emailVerified = true;
      verifiedUpdates += 1;
    }

    if (Object.keys($set).length > 0) {
      const filter = row.id
        ? { id: row.id }
        : { _id: row._id as mongoose.Types.ObjectId };
      await users.updateOne(filter, { $set });
    }
  }

  console.log(
    `[Tailnote] normalize-user-emails: ${emailUpdates} email(s) lowercased, ${verifiedUpdates} credential user(s) marked emailVerified.`
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
