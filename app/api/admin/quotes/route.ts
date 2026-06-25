import { NextResponse } from 'next/server';
import { createQuote, listQuotesAdmin } from '@/lib/admin/quotes';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  const limit = Number(url.searchParams.get('limit') ?? '20');
  const q = url.searchParams.get('q') ?? undefined;
  const categoryId = url.searchParams.get('categoryId') ?? undefined;
  const isActiveParam = url.searchParams.get('isActive');
  const isFeaturedParam = url.searchParams.get('isFeatured');

  const result = await listQuotesAdmin({
    page,
    limit,
    q,
    categoryId,
    isActive: isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined,
    isFeatured: isFeaturedParam === 'true' ? true : isFeaturedParam === 'false' ? false : undefined,
  });

  return NextResponse.json(result);
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
    const quote = await createQuote(json);
    return NextResponse.json({ quote }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
