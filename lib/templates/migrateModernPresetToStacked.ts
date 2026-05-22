import { connectMongoose } from '@/lib/mongoose';
import { SignaturePresetCatalogModel } from '@/models/SignaturePresetCatalog';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';

/** Idempotent: rename legacy presetId `modern` to `stacked` in catalog and org templates. */
export async function migrateModernPresetToStacked(): Promise<void> {
  await connectMongoose();

  const stackedExists = await SignaturePresetCatalogModel.exists({ presetId: 'stacked' });
  const modernExists = await SignaturePresetCatalogModel.exists({ presetId: 'modern' });

  if (modernExists && !stackedExists) {
    await SignaturePresetCatalogModel.updateOne(
      { presetId: 'modern' },
      { $set: { presetId: 'stacked', name: 'Stacked' } }
    );
  } else if (modernExists && stackedExists) {
    await SignaturePresetCatalogModel.deleteOne({ presetId: 'modern' });
  }

  await SignatureTemplateModel.updateMany(
    { presetId: 'modern' },
    { $set: { presetId: 'stacked', name: 'Stacked' } }
  );

  await SignatureTemplateModel.updateMany(
    { presetId: 'stacked', name: 'Modern' },
    { $set: { name: 'Stacked' } }
  );
}
