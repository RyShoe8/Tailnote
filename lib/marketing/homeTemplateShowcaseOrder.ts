import type { CatalogPresetRow } from '@/lib/templates/getEnabledPresets';
import type { TemplatePresetId } from '@/lib/email/templatePresets';

/** Fixed order for homepage hero carousel and signature rotator. */
export const HOME_TEMPLATE_SHOWCASE_ORDER = [
  'executive_minimalist',
  'ecard',
  'creator',
  'default',
  'modern_professional',
  'corporate',
  'professional',
  'portfolio',
  'stacked',
  'minimal',
] as const satisfies readonly TemplatePresetId[];

export type HomeShowcasePresetId = (typeof HOME_TEMPLATE_SHOWCASE_ORDER)[number];

/** Homepage carousel: fixed order, only presets that exist in the active catalog. */
export function sortPresetsForHomeShowcase(presets: CatalogPresetRow[]): CatalogPresetRow[] {
  const byId = new Map(presets.map((p) => [p.presetId, p]));
  return HOME_TEMPLATE_SHOWCASE_ORDER.map((id) => byId.get(id)).filter(
    (p): p is CatalogPresetRow => p !== undefined
  );
}
