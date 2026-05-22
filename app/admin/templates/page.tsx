import { connectMongoose } from '@/lib/mongoose';
import { ensurePresetCatalog } from '@/lib/templates/ensurePresetCatalog';
import { getFullCatalogPresets } from '@/lib/templates/getEnabledPresets';
import { countPresetUsageAcrossOrgs } from '@/lib/templates/presetUsage';
import {
  AdminTemplatesTable,
  type CatalogPresetRow,
} from '@/components/admin/AdminTemplatesTable';
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
    id === 'professional'
  );
}

export default async function AdminTemplatesPage() {
  await connectMongoose();
  await ensurePresetCatalog();
  const rows = await getFullCatalogPresets();

  const initialPresets: CatalogPresetRow[] = await Promise.all(
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Signature templates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enable, disable, or remove layout presets globally. Organizations only see enabled presets in
          signature and employee pickers.
        </p>
      </div>
      <AdminTemplatesTable initialPresets={initialPresets} />
    </div>
  );
}
