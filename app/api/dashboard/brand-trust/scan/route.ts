import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth/session';
import { registerOrgBrandTrustScan } from '@/lib/brandTrust/orgBrandTrustScans';
import { connectMongoose } from '@/lib/mongoose';
import { DomainValidationError, parseDomainInput } from '@/lib/email-health/domain';
import { isScanFresh } from '@/lib/email-health/cache';
import { persistEmailHealthScan } from '@/lib/email-health/persist';
import { persistBimiScanResult } from '@/lib/email-health/persistBimi';
import { runEmailHealthScan } from '@/lib/email-health/runScan';
import { emailHealthScanJsonResponse } from '@/lib/email-health/scanJsonResponse';
import { EmailHealthScanModel, type EmailHealthScanDoc } from '@/models/EmailHealthScan';
import { OrganizationModel } from '@/models/Organization';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  domain: z.string().min(1).max(300),
  force: z.boolean().optional(),
});

type SessionUser = { organizationId?: string };

function scanJsonResponse(doc: EmailHealthScanDoc, cached: boolean) {
  return NextResponse.json(emailHealthScanJsonResponse(doc, cached));
}

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
  try {
    ({ domain } = parseDomainInput(parsed.data.domain));
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
      if (user.organizationId) {
        await registerOrgBrandTrustScan(user.organizationId, domain, new Date(existing.scannedAt));
      }
      return scanJsonResponse(existing, true);
    }
  }

  try {
    let expectedLogoUrl: string | undefined;
    if (user.organizationId) {
      const org = await OrganizationModel.findById(user.organizationId)
        .select('bimiLogoUrl')
        .lean<{ bimiLogoUrl?: string } | null>();
      const url = org?.bimiLogoUrl?.trim();
      if (url) expectedLogoUrl = url;
    }

    const report = await runEmailHealthScan(domain, { expectedLogoUrl });
    const saved = await persistEmailHealthScan(report, {});

    if (report.bimiDetail) {
      await persistBimiScanResult({
        domain,
        result: report.bimiDetail,
        organizationId: user.organizationId ?? null,
      });
    }

    if (!saved) {
      const doc = await EmailHealthScanModel.findOne({ domain }).lean<EmailHealthScanDoc>();
      if (!doc) {
        return NextResponse.json({ error: 'Scan failed. Please try again.' }, { status: 500 });
      }
      if (user.organizationId) {
        await registerOrgBrandTrustScan(user.organizationId, domain, new Date(doc.scannedAt));
      }
      return scanJsonResponse(doc, false);
    }

    if (user.organizationId) {
      await registerOrgBrandTrustScan(user.organizationId, domain, new Date(saved.scannedAt));
    }

    return scanJsonResponse(saved as EmailHealthScanDoc, false);
  } catch (err) {
    logError('api/dashboard/brand-trust/scan', err);
    return NextResponse.json({ error: 'Scan failed. Please try again.' }, { status: 500 });
  }
}
