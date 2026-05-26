import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DomainValidationError, parseDomainInput } from '@/lib/email-health/domain';
import { isScanFresh } from '@/lib/email-health/cache';
import { persistEmailHealthScan } from '@/lib/email-health/persist';
import { runEmailHealthScan } from '@/lib/email-health/runScan';
import { connectMongoose } from '@/lib/mongoose';
import { EmailHealthScanModel } from '@/models/EmailHealthScan';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  domain: z.string().min(1).max(300),
  force: z.boolean().optional(),
});

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateBuckets = new Map<string, number[]>();

function ipFromHeaders(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  const first = forwarded.split(',')[0]?.trim();
  if (first) return first;
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function takeRateSlot(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const existing = rateBuckets.get(ip) ?? [];
  const recent = existing.filter((ts) => ts > windowStart);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  rateBuckets.set(ip, recent);
  return true;
}

export async function POST(request: Request) {
  const ip = ipFromHeaders(request);
  if (!takeRateSlot(ip)) {
    return NextResponse.json(
      { error: 'Too many scans. Please wait a few minutes and try again.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  let domain: string;
  let domainSlug: string;
  try {
    ({ domain, domainSlug } = parseDomainInput(parsed.data.domain));
  } catch (err) {
    if (err instanceof DomainValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  await connectMongoose();

  if (!parsed.data.force) {
    const existing = await EmailHealthScanModel.findOne({ domain }).lean();
    if (existing?.scannedAt && isScanFresh(new Date(existing.scannedAt))) {
      return NextResponse.json({
        cached: true,
        slug: existing.domainSlug,
        domain: existing.domain,
        score: existing.score,
        statusLabel: existing.statusLabel,
        scannedAt: existing.scannedAt,
      });
    }
  }

  try {
    const report = await runEmailHealthScan(domain);
    const userAgent = request.headers.get('user-agent') ?? undefined;
    await persistEmailHealthScan(report, { ip, userAgent });

    return NextResponse.json({
      cached: false,
      slug: report.domainSlug,
      domain: report.domain,
      score: report.score,
      statusLabel: report.statusLabel,
      scannedAt: report.scannedAt,
    });
  } catch (err) {
    console.error('[email-health] scan failed', err);
    return NextResponse.json(
      { error: 'Scan failed. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
