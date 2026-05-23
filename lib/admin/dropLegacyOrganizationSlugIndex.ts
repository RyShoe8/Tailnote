import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';

const LEGACY_INDEX = 'slug_1';

export type DropLegacyOrganizationSlugIndexResult = {
  droppedSlugIndex: boolean;
  clearedSlugCount: number;
};

export async function dropLegacyOrganizationSlugIndex(): Promise<DropLegacyOrganizationSlugIndexResult> {
  await connectMongoose();
  const collection = OrganizationModel.collection;

  const indexes = await collection.indexes();
  const hasSlugIndex = indexes.some((idx) => idx.name === LEGACY_INDEX);

  let droppedSlugIndex = false;
  if (hasSlugIndex) {
    try {
      await collection.dropIndex(LEGACY_INDEX);
      droppedSlugIndex = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes('index not found')) {
        throw err;
      }
    }
  }

  const unsetResult = await collection.updateMany({}, { $unset: { slug: '' } });

  return {
    droppedSlugIndex,
    clearedSlugCount: unsetResult.modifiedCount,
  };
}
