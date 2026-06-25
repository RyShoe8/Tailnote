import { NextResponse } from 'next/server';
import { listActiveQuoteCategories } from '@/lib/quotes/loadQuotes';
import { getServerSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categories = await listActiveQuoteCategories();
  return NextResponse.json({ categories });
}
