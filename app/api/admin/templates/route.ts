import { NextResponse } from 'next/server';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { ensurePresetCatalog } from '@/lib/templates/ensurePresetCatalog';
import { getFullCatalogPresets } from '@/lib/templates/getEnabledPresets';
import { countPresetUsageAcrossOrgs } from '@/lib/templates/presetUsage';
import type { CatalogPresetId } from '@/models/SignaturePresetCatalog';

export const dynamic = 'force-dynamic';

function isCatalogPresetId(id: string): id is CatalogPresetId {
  return (
    id === 'default' ||
    id === 'creator' ||
    id === 'executive_minimalist' ||
    id === 'minimal' ||
    id === 'stacked' ||
    id === 'corporate' ||
    id === 'professional' ||
    id === 'portfolio'
  );
}

export async function GET() {
  const gate = await requirePlatformAdminApi();
  if (gate) return gate;

  await ensurePresetCatalog();
  const rows = await getFullCatalogPresets();

  const presets = await Promise.all(
    rows.map(async (r) => {
      const presetId = String(r.presetId);
      const usage = isCatalogPresetId(presetId)
        ? await countPresetUsageAcrossOrgs(presetId)
        : { employeeCount: 0, orgTemplateCount: 0 };
      return {
        presetId,
        name: String(r.name ?? presetId),
        description: String(r.description ?? ''),
        enabled: Boolean(r.enabled),
        deletedAt: r.deletedAt ? new Date(r.deletedAt).toISOString() : null,
        sortOrder: Number(r.sortOrder ?? 0),
        employeeCount: usage.employeeCount,
        orgTemplateCount: usage.orgTemplateCount,
      };
    })
  );

  return NextResponse.json({ presets });
}
