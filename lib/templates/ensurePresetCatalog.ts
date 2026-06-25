import { connectMongoose } from '@/lib/mongoose';
import { TEMPLATE_PRESET_META } from '@/lib/email/templatePresets';
import { SignaturePresetCatalogModel } from '@/models/SignaturePresetCatalog';
import { migrateModernPresetToStacked } from '@/lib/templates/migrateModernPresetToStacked';

/** Idempotent: ensure all built-in presets exist in the platform catalog and sync name/description from code. */
export async function ensurePresetCatalog(): Promise<void> {
  await connectMongoose();
  await migrateModernPresetToStacked();
  for (let i = 0; i < TEMPLATE_PRESET_META.length; i += 1) {
    const meta = TEMPLATE_PRESET_META[i];
    await SignaturePresetCatalogModel.updateOne(
      { presetId: meta.id },
      {
        $set: { name: meta.name, description: meta.description, sortOrder: i },
        $setOnInsert: { enabled: true, deletedAt: null },
      },
      { upsert: true }
    );
  }
}
