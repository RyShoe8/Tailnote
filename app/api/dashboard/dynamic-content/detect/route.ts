import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import { autoDetectContent } from '@/lib/dynamic-content/registry';
import { fetchManualRss } from '@/lib/dynamic-content/registry';
import { normalizeWebsiteUrl } from '@/lib/dynamic-content/types';

type SessionUser = { organizationId?: string; id?: string };

const BodySchema = z.object({
  websiteUrl: z.string().optional(),
  feedUrl: z.string().optional(),
  detectionMode: z.enum(['auto', 'rss']).default('auto'),
});

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  if (!getBillingEntitlements(org).canUseDynamicContent) {
    return NextResponse.json(
      { error: 'Dynamic Content is available on paid plans' },
      { status: 402 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    if (parsed.data.detectionMode === 'rss') {
      const feedUrl = (parsed.data.feedUrl || parsed.data.websiteUrl || '').trim();
      if (!feedUrl) {
        return NextResponse.json({ error: 'feedUrl is required' }, { status: 400 });
      }
      const result = await fetchManualRss(feedUrl);
      if (result.kind === 'error') {
        return NextResponse.json({ error: result.message }, { status: 502 });
      }
      if (result.kind === 'not_modified') {
        return NextResponse.json({ items: [], feedUrl, detectionMethod: 'rss_manual' });
      }
      return NextResponse.json({
        items: result.items,
        feedUrl: result.feedUrl || feedUrl,
        detectionMethod: 'rss_manual',
      });
    }

    const websiteUrl = normalizeWebsiteUrl(parsed.data.websiteUrl || '');
    if (!websiteUrl) {
      return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 });
    }
    const detected = await autoDetectContent(websiteUrl);
    if (!detected) {
      return NextResponse.json(
        { error: 'Could not detect content. Try RSS Feed (Advanced) with a feed URL.' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      items: detected.items,
      feedUrl: detected.feedUrl,
      detectionMethod: detected.detectionMethod,
      websiteUrl,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Detect failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
