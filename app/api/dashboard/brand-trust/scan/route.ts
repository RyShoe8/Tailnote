import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { DomainValidationError, parseDomainInput } from '@/lib/email-health/domain';
import { isScanFresh } from '@/lib/email-health/cache';
import { persistEmailHealthScan } from '@/lib/email-health/persist';
import { persistBimiScanResult } from '@/lib/email-health/persistBimi';
import { runEmailHealthScan } from '@/lib/email-health/runScan';
import { EmailHealthScanModel } from '@/models/EmailHealthScan';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  domain: z.string().min(1).max(300),
  force: z.boolean().optional(),
});

type SessionUser = { organizationId?: string };

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;

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
    await persistEmailHealthScan(report, {});

    if (report.bimiDetail) {
      await persistBimiScanResult({
        domain,
        result: report.bimiDetail,
        organizationId: user.organizationId ?? null,
      });
    }

    return NextResponse.json({
      cached: false,
      slug: domainSlug,
      domain,
      score: report.score,
      statusLabel: report.statusLabel,
      scannedAt: report.scannedAt,
    });
  } catch (err) {
    logError('api/dashboard/brand-trust/scan', err);
    return NextResponse.json({ error: 'Scan failed. Please try again.' }, { status: 500 });
  }
}
