import { NextResponse } from 'next/server';
import { createQuoteCategory, listQuoteCategoriesAdmin } from '@/lib/admin/quoteCategories';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const categories = await listQuoteCategoriesAdmin();
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const category = await createQuoteCategory(json);
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
