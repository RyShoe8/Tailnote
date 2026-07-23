import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { ContentSourceModel } from '@/models/ContentSource';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import {
  ensureAndRefreshContentSource,
  refreshExistingContentSource,
} from '@/lib/dynamic-content/syncSource';

type SessionUser = { organizationId?: string; id?: string };

const BodySchema = z.object({
  contentSourceId: z.string().optional(),
  websiteUrl: z.string().optional(),
  feedUrl: z.string().optional(),
  detectionMode: z.enum(['auto', 'rss']).default('auto'),
  postsToDisplay: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
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
    if (
      parsed.data.contentSourceId &&
      !parsed.data.websiteUrl &&
      !parsed.data.feedUrl &&
      mongoose.Types.ObjectId.isValid(parsed.data.contentSourceId)
    ) {
      const owned = await ContentSourceModel.findOne({
        _id: parsed.data.contentSourceId,
        organizationId: user.organizationId,
      });
      if (!owned) {
        return NextResponse.json({ error: 'Content source not found' }, { status: 404 });
      }
      if (parsed.data.postsToDisplay) {
        owned.postsToDisplay = parsed.data.postsToDisplay;
        await owned.save();
      }
      const refreshed = await refreshExistingContentSource(String(owned._id));
      return NextResponse.json(refreshed);
    }

    const result = await ensureAndRefreshContentSource({
      organizationId: user.organizationId,
      ownerUserId: user.id,
      websiteUrl: parsed.data.websiteUrl,
      feedUrl: parsed.data.feedUrl,
      detectionMode: parsed.data.detectionMode,
      postsToDisplay: parsed.data.postsToDisplay,
      existingSourceId: parsed.data.contentSourceId,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Refresh failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
