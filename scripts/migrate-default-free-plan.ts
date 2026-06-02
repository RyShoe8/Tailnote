/**
 * Manual backfill (optional). Production runs this automatically on first DB connect after deploy.
 * Run locally only if needed: npm run migrate:default-free-plan
 */
import mongoose from 'mongoose';
import { connectMongoose } from '../lib/mongoose';
import { migrateDefaultFreePlanOrganizations } from '../lib/migrations/migrateDefaultFreePlan';

async function main() {
  await connectMongoose();
  const result = await migrateDefaultFreePlanOrganizations();
  process.stdout.write(
    `migrate-default-free-plan: orgs=${result.totalOrganizations} paidPreserved=${result.paidPlanBackfilled} freeDefaulted=${result.freePlanDefaulted}\n`
  );
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
