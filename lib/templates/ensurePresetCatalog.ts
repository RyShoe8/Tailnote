import { connectMongoose } from '@/lib/mongoose';
import { TEMPLATE_PRESET_META } from '@/lib/email/templatePresets';
import { SignaturePresetCatalogModel } from '@/models/SignaturePresetCatalog';
import { migrateModernPresetToStacked } from '@/lib/templates/migrateModernPresetToStacked';

/** Idempotent: ensure all built-in presets exist in the platform catalog. */
export async function ensurePresetCatalog(): Promise<void> {
  await connectMongoose();
  await migrateModernPresetToStacked();
  for (let i = 0; i < TEMPLATE_PRESET_META.length; i += 1) {
    const meta = TEMPLATE_PRESET_META[i];
    const exists = await SignaturePresetCatalogModel.exists({ presetId: meta.id });
    if (exists) continue;
    await SignaturePresetCatalogModel.create({
      presetId: meta.id,
      enabled: true,
      deletedAt: null,
      name: meta.name,
      description: meta.description,
      sortOrder: i,
    });
  }
}
