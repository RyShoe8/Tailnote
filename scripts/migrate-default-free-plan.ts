/**
 * Backfills organization plan to FREE for non-paid organizations.
 * Run: npx tsx scripts/migrate-default-free-plan.ts
 */
import mongoose from 'mongoose';
import { connectMongoose } from '../lib/mongoose';
import { OrganizationModel } from '../models/Organization';

async function main() {
  await connectMongoose();

  const paidStatuses = ['active', 'trialing'];
  const preservePaid = await OrganizationModel.updateMany(
    {
      subscriptionStatus: { $in: paidStatuses },
      plan: { $in: [null, '', 'none'] },
    },
    { $set: { plan: 'team' } }
  );

  const defaultFree = await OrganizationModel.updateMany(
    {
      $or: [
        { subscriptionStatus: { $exists: false } },
        { subscriptionStatus: null },
        { subscriptionStatus: { $nin: paidStatuses } },
      ],
    },
    {
      $set: {
        plan: 'free',
        subscriptionStatus: 'none',
        signatureClickTrackingEnabled: false,
        signatureOpenTrackingEnabled: false,
      },
    }
  );

  const totals = await OrganizationModel.countDocuments();
  process.stdout.write(
    `migrate-default-free-plan: orgs=${totals} paidPreserved=${preservePaid.modifiedCount} freeDefaulted=${defaultFree.modifiedCount}\n`
  );

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
