/**
 * One-time maintenance: drop legacy unique index on organizations.slug (field removed from schema).
 * Run from repo root with target MONGODB_URI:
 *   npx tsx scripts/drop-legacy-organization-slug-index.ts
 * Or: npm run migrate:org-slug-index
 */
import mongoose from 'mongoose';
import { dropLegacyOrganizationSlugIndex } from '../lib/admin/dropLegacyOrganizationSlugIndex';

async function main() {
  const result = await dropLegacyOrganizationSlugIndex();

  if (result.droppedSlugIndex) {
    console.log('[Tailnote] Dropped legacy index slug_1 on organizations.');
  } else {
    console.log('[Tailnote] No slug_1 index on organizations — nothing to drop.');
  }

  console.log(
    `[Tailnote] Cleared slug field on ${result.clearedSlugCount} organization document(s).`
  );

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
