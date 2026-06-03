import { migrateDefaultFreePlanOrganizations } from '@/lib/migrations/migrateDefaultFreePlan';
import { migrateFreemiumPlanFlag } from '@/lib/migrations/migrateFreemiumPlanFlag';

type GlobalMigrations = typeof globalThis & {
  tailnoteStartupMigrationsDone?: boolean;
  tailnoteStartupMigrationsPromise?: Promise<void>;
};

const g = globalThis as GlobalMigrations;

/**
 * Runs once per server instance after MongoDB connects (e.g. first request post-deploy).
 * No manual `npm run migrate:default-free-plan` needed in production.
 */
export async function ensureStartupMigrations(): Promise<void> {
  if (g.tailnoteStartupMigrationsDone) return;
  if (g.tailnoteStartupMigrationsPromise) {
    await g.tailnoteStartupMigrationsPromise;
    return;
  }

  g.tailnoteStartupMigrationsPromise = (async () => {
    const [orgResult, planResult] = await Promise.all([
      migrateDefaultFreePlanOrganizations(),
      migrateFreemiumPlanFlag(),
    ]);
    if (orgResult.paidPlanBackfilled > 0 || orgResult.freePlanDefaulted > 0) {
      console.info(
        '[startup migrations] default free plan:',
        `orgs=${orgResult.totalOrganizations}`,
        `paidBackfilled=${orgResult.paidPlanBackfilled}`,
        `freeDefaulted=${orgResult.freePlanDefaulted}`
      );
    }
    if (planResult.freePlansMarked > 0 || planResult.complimentaryPlansCleared > 0) {
      console.info(
        '[startup migrations] freemium plan flag:',
        `freeMarked=${planResult.freePlansMarked}`,
        `complimentaryCleared=${planResult.complimentaryPlansCleared}`
      );
    }
    g.tailnoteStartupMigrationsDone = true;
  })().finally(() => {
    g.tailnoteStartupMigrationsPromise = undefined;
  });

  await g.tailnoteStartupMigrationsPromise;
}
