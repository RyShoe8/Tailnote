import type { Types } from 'mongoose';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { getActiveCatalogPresets } from '@/lib/templates/getEnabledPresets';

export const ORG_TEMPLATE_PRESETS = [
  'default',
  'creator',
  'executive_minimalist',
  'minimal',
  'stacked',
  'corporate',
  'professional',
] as const;

export async function seedDefaultTemplates(organizationId: Types.ObjectId) {
  const presets = await getActiveCatalogPresets();
  for (const preset of presets) {
    await SignatureTemplateModel.create({
      organizationId,
      name: preset.name,
      presetId: preset.presetId,
      includeAnimationSlot: false,
      config: {},
    });
  }
}

/** Idempotent: add org rows for any globally enabled preset missing for this org. */
export async function ensureOrgPresetTemplates(organizationId: Types.ObjectId | string) {
  const presets = await getActiveCatalogPresets();
  for (const preset of presets) {
    const exists = await SignatureTemplateModel.exists({
      organizationId,
      presetId: preset.presetId,
    });
    if (exists) continue;
    await SignatureTemplateModel.create({
      organizationId,
      name: preset.name,
      presetId: preset.presetId,
      includeAnimationSlot: false,
      config: {},
    });
  }
}

export async function getDefaultTemplateForOrg(organizationId: Types.ObjectId) {
  const defaultTmpl = await SignatureTemplateModel.findOne({
    organizationId,
    presetId: 'default',
  }).sort({ createdAt: 1 });
  if (defaultTmpl) return defaultTmpl;

  const minimal = await SignatureTemplateModel.findOne({
    organizationId,
    presetId: 'minimal',
  }).sort({ createdAt: 1 });
  if (minimal) return minimal;

  const presets = await getActiveCatalogPresets();
  const firstPresetId = presets[0]?.presetId ?? 'default';
  return SignatureTemplateModel.findOne({ organizationId, presetId: firstPresetId }).sort({
    createdAt: 1,
  });
}
