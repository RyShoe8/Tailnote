import { NextResponse } from 'next/server';
import { deleteEmailHealthScan } from '@/lib/admin/emailHealthScans';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const deleted = await deleteEmailHealthScan(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
