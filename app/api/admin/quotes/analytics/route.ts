import { NextResponse } from 'next/server';
import { getQuoteAnalyticsSummary } from '@/lib/admin/quoteAnalytics';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const summary = await getQuoteAnalyticsSummary();
  return NextResponse.json(summary);
}
