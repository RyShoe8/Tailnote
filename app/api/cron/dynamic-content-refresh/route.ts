import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { ContentSourceModel } from '@/models/ContentSource';
import { OrganizationModel } from '@/models/Organization';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import { refreshExistingContentSource } from '@/lib/dynamic-content/syncSource';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const STALE_MS = 24 * 60 * 60 * 1000;
const BATCH = 40;

/**
 * Refresh Dynamic Content sources older than 24 hours.
 * Auth: Authorization: Bearer ${CRON_SECRET} (same as campaign-publisher).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectMongoose();
  const cutoff = new Date(Date.now() - STALE_MS);

  const sources = await ContentSourceModel.find({
    $or: [{ lastFetchedAt: { $exists: false } }, { lastFetchedAt: null }, { lastFetchedAt: { $lt: cutoff } }],
  })
    .sort({ lastFetchedAt: 1 })
    .limit(BATCH)
    .lean();

  let refreshed = 0;
  let changed = 0;
  let errors = 0;
  let skippedUnpaid = 0;

  for (const source of sources) {
    const org = await OrganizationModel.findById(source.organizationId)
      .select('plan subscriptionStatus')
      .lean();
    if (!org || !getBillingEntitlements(org).canUseDynamicContent) {
      skippedUnpaid += 1;
      continue;
    }

    try {
      const result = await refreshExistingContentSource(String(source._id));
      refreshed += 1;
      if (result.changed) changed += 1;
      if (result.status === 'error') errors += 1;
    } catch {
      errors += 1;
    }
  }

  return NextResponse.json({
    success: true,
    examined: sources.length,
    refreshed,
    changed,
    errors,
    skippedUnpaid,
  });
}
