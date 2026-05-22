import { connectMongoose } from '@/lib/mongoose';
import type { TemplatePresetId } from '@/lib/email/templatePresets';
import {
  SignaturePresetCatalogModel,
  type CatalogPresetId,
  type SignaturePresetCatalogDoc,
} from '@/models/SignaturePresetCatalog';
import { ensurePresetCatalog } from '@/lib/templates/ensurePresetCatalog';

export type CatalogPresetRow = {
  presetId: CatalogPresetId;
  name: string;
  description: string;
  sortOrder: number;
};

function isCatalogPresetId(id: string): id is CatalogPresetId {
  return (
    id === 'default' ||
    id === 'creator' ||
    id === 'executive_minimalist' ||
    id === 'minimal' ||
    id === 'stacked' ||
    id === 'corporate' ||
    id === 'professional' ||
    id === 'portfolio' ||
    id === 'ecard'
  );
}

/** Active catalog entries: enabled and not soft-deleted. */
export async function getActiveCatalogPresets(): Promise<CatalogPresetRow[]> {
  await ensurePresetCatalog();
  const rows = await SignaturePresetCatalogModel.find({
    enabled: true,
    deletedAt: null,
  })
    .sort({ sortOrder: 1, presetId: 1 })
    .lean<SignaturePresetCatalogDoc[]>();

  return rows
    .filter((r) => isCatalogPresetId(String(r.presetId)))
    .map((r) => ({
      presetId: r.presetId as CatalogPresetId,
      name: String(r.name ?? r.presetId),
      description: String(r.description ?? ''),
      sortOrder: Number(r.sortOrder ?? 0),
    }));
}

export async function getEnabledPresetIds(): Promise<Set<TemplatePresetId>> {
  const rows = await getActiveCatalogPresets();
  return new Set(rows.map((r) => r.presetId));
}

export async function isPresetAvailable(presetId: string): Promise<boolean> {
  const enabled = await getEnabledPresetIds();
  return enabled.has(presetId as TemplatePresetId);
}

/** All catalog rows including disabled/deleted (for platform admin). */
export async function getFullCatalogPresets(): Promise<SignaturePresetCatalogDoc[]> {
  await ensurePresetCatalog();
  return SignaturePresetCatalogModel.find({})
    .sort({ sortOrder: 1, presetId: 1 })
    .lean<SignaturePresetCatalogDoc[]>();
}
