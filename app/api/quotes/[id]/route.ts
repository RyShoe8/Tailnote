import { NextResponse } from 'next/server';
import { getActiveQuoteById } from '@/lib/quotes/loadQuotes';
import { getServerSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const quote = await getActiveQuoteById(id);
  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }
  return NextResponse.json({ quote });
}
