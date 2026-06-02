import { migrateDefaultFreePlanOrganizations } from '@/lib/migrations/migrateDefaultFreePlan';

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
    const result = await migrateDefaultFreePlanOrganizations();
    if (result.paidPlanBackfilled > 0 || result.freePlanDefaulted > 0) {
      console.info(
        '[startup migrations] default free plan:',
        `orgs=${result.totalOrganizations}`,
        `paidBackfilled=${result.paidPlanBackfilled}`,
        `freeDefaulted=${result.freePlanDefaulted}`
      );
    }
    g.tailnoteStartupMigrationsDone = true;
  })().finally(() => {
    g.tailnoteStartupMigrationsPromise = undefined;
  });

  await g.tailnoteStartupMigrationsPromise;
}
