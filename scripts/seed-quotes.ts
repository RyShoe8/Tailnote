/**
 * Seed quote categories and sample quotes if none exist.
 * Run from repo root: npx tsx scripts/seed-quotes.ts
 */
import { seedQuoteLibrary } from '../lib/migrations/seedQuoteLibrary';

async function main() {
  const result = await seedQuoteLibrary();
  if (result.seeded) {
    console.log(
      `Seeded ${result.categoriesCreated} categories and ${result.quotesCreated} quotes.`
    );
  } else {
    console.log('Quote library already exists; skipped seed.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
