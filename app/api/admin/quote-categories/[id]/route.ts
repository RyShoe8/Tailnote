import { NextResponse } from 'next/server';
import {
  deleteQuoteCategory,
  getQuoteCategoryById,
  updateQuoteCategory,
} from '@/lib/admin/quoteCategories';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const category = await getQuoteCategoryById(id);
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }
  return NextResponse.json({ category });
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
    const category = await updateQuoteCategory(id, json);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  try {
    const deleted = await deleteQuoteCategory(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
