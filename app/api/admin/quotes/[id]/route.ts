import { NextResponse } from 'next/server';
import { deleteQuote, getQuoteById, updateQuote } from '@/lib/admin/quotes';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const quote = await getQuoteById(id);
  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }
  return NextResponse.json({ quote });
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const quote = await updateQuote(id, json);
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    return NextResponse.json({ quote });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const deleted = await deleteQuote(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
