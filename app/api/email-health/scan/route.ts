import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logError } from '@/lib/logger';
import { DomainValidationError, parseDomainInput } from '@/lib/email-health/domain';
import { ipFromRequestHeaders, isRateLimited } from '@/lib/security/rateLimit';
import { isScanFresh } from '@/lib/email-health/cache';
import { persistEmailHealthScan } from '@/lib/email-health/persist';
import { persistBimiScanResult } from '@/lib/email-health/persistBimi';
import { runEmailHealthScan } from '@/lib/email-health/runScan';
import { emailHealthScanJsonResponse } from '@/lib/email-health/scanJsonResponse';
import { connectMongoose } from '@/lib/mongoose';
import { EmailHealthScanModel, type EmailHealthScanDoc } from '@/models/EmailHealthScan';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  domain: z.string().min(1).max(300),
  force: z.boolean().optional(),
});

const EMAIL_HEALTH_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 10 };

export async function POST(request: Request) {
  if (isRateLimited(request, EMAIL_HEALTH_RATE_LIMIT)) {
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
    const existing = await EmailHealthScanModel.findOne({ domain }).lean<EmailHealthScanDoc>();
    if (existing?.scannedAt && isScanFresh(new Date(existing.scannedAt))) {
      return NextResponse.json(emailHealthScanJsonResponse(existing, true));
    }
  }

  try {
    const report = await runEmailHealthScan(domain);
    const userAgent = request.headers.get('user-agent') ?? undefined;
    const saved = await persistEmailHealthScan(report, { ip: ipFromRequestHeaders(request), userAgent });

    if (report.bimiDetail) {
      await persistBimiScanResult({ domain, result: report.bimiDetail, organizationId: null });
    }

    if (!saved) {
      const doc = await EmailHealthScanModel.findOne({ domain }).lean<EmailHealthScanDoc>();
      if (!doc) {
        return NextResponse.json({ error: 'Scan failed. Please try again.' }, { status: 500 });
      }
      return NextResponse.json(emailHealthScanJsonResponse(doc, false));
    }

    return NextResponse.json(emailHealthScanJsonResponse(saved as EmailHealthScanDoc, false));
  } catch (err) {
    logError('api/email-health/scan', err);
    return NextResponse.json(
      { error: 'Scan failed. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
