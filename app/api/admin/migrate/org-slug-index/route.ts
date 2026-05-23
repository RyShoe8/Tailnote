// TEMP: remove after slug_1 migration is run in production
import { NextResponse } from 'next/server';
import { dropLegacyOrganizationSlugIndex } from '@/lib/admin/dropLegacyOrganizationSlugIndex';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';

export const dynamic = 'force-dynamic';

export async function POST() {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  try {
    const result = await dropLegacyOrganizationSlugIndex();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[admin] org slug index migration failed', err);
    const message = err instanceof Error ? err.message : 'Migration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
