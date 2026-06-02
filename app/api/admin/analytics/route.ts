import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getAdminAnalyticsSeries,
  type AdminAnalyticsGroupBy,
  type AdminAnalyticsMetric,
} from '@/lib/admin/data';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  metric: z.enum(['organizations', 'users', 'mrr', 'arr', 'copies', 'clicks', 'opens']),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  presetDays: z.coerce.number().int().min(1).max(365).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

function parseDate(input: string | undefined, fallback: Date): Date {
  if (!input) return fallback;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export async function GET(request: Request) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    metric: url.searchParams.get('metric'),
    groupBy: url.searchParams.get('groupBy') ?? 'day',
    presetDays: url.searchParams.get('presetDays') ?? undefined,
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }

  const now = new Date();
  const days = parsed.data.presetDays ?? 30;
  const from = parseDate(parsed.data.from, new Date(now.getTime() - days * 864e5));
  const to = parseDate(parsed.data.to, now);

  try {
    const series = await getAdminAnalyticsSeries({
      metric: parsed.data.metric as AdminAnalyticsMetric,
      groupBy: parsed.data.groupBy as AdminAnalyticsGroupBy,
      from,
      to,
    });
    return NextResponse.json({
      metric: parsed.data.metric,
      groupBy: parsed.data.groupBy,
      from: from.toISOString(),
      to: to.toISOString(),
      series,
    });
  } catch (err) {
    logError('api/admin/analytics', err);
    return NextResponse.json({ error: 'Could not load analytics' }, { status: 500 });
  }
}
