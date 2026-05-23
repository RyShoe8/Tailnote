/**
 * One-time maintenance: drop legacy unique index on organizations.slug (field removed from schema).
 * Run from repo root with target MONGODB_URI:
 *   npx tsx scripts/drop-legacy-organization-slug-index.ts
 * Or: npm run migrate:org-slug-index
 */
import mongoose from 'mongoose';
import { connectMongoose } from '../lib/mongoose';
import { OrganizationModel } from '../models/Organization';

const LEGACY_INDEX = 'slug_1';

async function main() {
  await connectMongoose();
  const collection = OrganizationModel.collection;

  const indexes = await collection.indexes();
  const hasSlugIndex = indexes.some((idx) => idx.name === LEGACY_INDEX);

  if (hasSlugIndex) {
    try {
      await collection.dropIndex(LEGACY_INDEX);
      console.log(`[Tailnote] Dropped legacy index ${LEGACY_INDEX} on organizations.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes('index not found')) {
        throw err;
      }
      console.log(`[Tailnote] Index ${LEGACY_INDEX} was already removed.`);
    }
  } else {
    console.log(`[Tailnote] No ${LEGACY_INDEX} index on organizations — nothing to drop.`);
  }

  const unsetResult = await collection.updateMany({}, { $unset: { slug: '' } });
  console.log(
    `[Tailnote] Cleared slug field on ${unsetResult.modifiedCount} organization document(s).`
  );

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
