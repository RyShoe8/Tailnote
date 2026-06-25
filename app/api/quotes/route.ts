import { NextResponse } from 'next/server';
import { listActiveQuotes } from '@/lib/quotes/loadQuotes';
import { getServerSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  const limit = Number(url.searchParams.get('limit') ?? '20');
  const q = url.searchParams.get('q') ?? undefined;
  const categoryId = url.searchParams.get('categoryId') ?? undefined;
  const featured = url.searchParams.get('featured') === 'true' ? true : undefined;

  const result = await listActiveQuotes({ page, limit, q, categoryId, featured });
  return NextResponse.json(result);
}
