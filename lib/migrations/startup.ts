import { migrateDefaultFreePlanOrganizations } from '@/lib/migrations/migrateDefaultFreePlan';
import { migrateFreemiumPlanFlag } from '@/lib/migrations/migrateFreemiumPlanFlag';
import { migrateLatestBlogsToDynamicContent } from '@/lib/migrations/migrateLatestBlogsToDynamicContent';
import { seedQuoteLibrary } from '@/lib/migrations/seedQuoteLibrary';

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
    const [orgResult, planResult, quoteSeedResult, blogsResult] = await Promise.all([
      migrateDefaultFreePlanOrganizations(),
      migrateFreemiumPlanFlag(),
      seedQuoteLibrary(),
      migrateLatestBlogsToDynamicContent(),
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
    if (quoteSeedResult.seeded) {
      console.info(
        '[startup migrations] quote library:',
        `categories=${quoteSeedResult.categoriesCreated}`,
        `quotes=${quoteSeedResult.quotesCreated}`
      );
    }
    if (
      blogsResult.employeesUpdated > 0 ||
      blogsResult.profilesUpdated > 0 ||
      blogsResult.sourcesCreated > 0
    ) {
      console.info(
        '[startup migrations] latest_blogs → dynamic_content:',
        `employees=${blogsResult.employeesUpdated}`,
        `profiles=${blogsResult.profilesUpdated}`,
        `submissions=${blogsResult.submissionsUpdated}`,
        `sources=${blogsResult.sourcesCreated}`
      );
    }
    g.tailnoteStartupMigrationsDone = true;
  })().finally(() => {
    g.tailnoteStartupMigrationsPromise = undefined;
  });

  await g.tailnoteStartupMigrationsPromise;
}
