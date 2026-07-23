import mongoose from 'mongoose';
import { AUTH_USER_COLLECTION } from '@/lib/auth/platformAdmin';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import { ContentSourceModel } from '@/models/ContentSource';
import { ContentItemModel } from '@/models/ContentItem';
import { EmployeeModel } from '@/models/Employee';
import { UserSignatureProfileModel } from '@/models/UserSignatureProfile';
import { stableContentImageUrl } from '@/lib/dynamic-content/urls';
import type { ContentBlockData } from 'emailsignature-engine';

export type MigrateLatestBlogsResult = {
  employeesUpdated: number;
  profilesUpdated: number;
  submissionsUpdated: number;
  sourcesCreated: number;
  imagesGenerated: number;
};

type LegacyBlock = ContentBlockData & {
  rssUrl?: string;
  rssItems?: { title: string; url: string; imageUrl?: string; pubDate?: string }[];
};

async function migrateBlockArray(
  blocks: LegacyBlock[] | undefined,
  organizationId: mongoose.Types.ObjectId | string | undefined,
  ownerUserId: string
): Promise<{ blocks: ContentBlockData[]; sourcesCreated: number; imagesGenerated: number }> {
  if (!Array.isArray(blocks) || !blocks.length) {
    return { blocks: blocks ?? [], sourcesCreated: 0, imagesGenerated: 0 };
  }

  let sourcesCreated = 0;
  const next: ContentBlockData[] = [];

  for (const block of blocks) {
    if (block.type !== 'latest_blogs') {
      next.push(block);
      continue;
    }

    const feedUrl = (block.feedUrl || block.rssUrl || '').trim();
    const websiteUrl = (block.websiteUrl || feedUrl).trim();
    let contentSourceId = block.contentSourceId;

    if (!contentSourceId && organizationId && feedUrl) {
      const source = await ContentSourceModel.create({
        organizationId,
        ownerUserId,
        websiteUrl,
        feedUrl,
        detectionMethod: 'migrated_rss',
        lastFetchedAt: block.rssLastFetched ? new Date(block.rssLastFetched) : new Date(),
        status: 'ok',
        postsToDisplay: block.postsToDisplay || 1,
      });
      contentSourceId = String(source._id);
      sourcesCreated += 1;

      for (const item of (block.rssItems || []).slice(0, 10)) {
        const guid = item.url || item.title;
        await ContentItemModel.findOneAndUpdate(
          { contentSourceId: source._id, guid },
          {
            $set: {
              title: item.title,
              url: item.url,
              imageUrl: item.imageUrl || '',
              publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
            },
          },
          { upsert: true }
        );
      }
      // Image bytes are generated later via cron / detect-refresh (avoid Sharp on startup).
    }

    next.push({
      ...block,
      type: 'dynamic_content',
      contentSourceId,
      websiteUrl: websiteUrl || block.websiteUrl,
      feedUrl: feedUrl || block.feedUrl,
      detectionMode: block.detectionMode || 'rss',
      postsToDisplay: block.postsToDisplay || 1,
      contentImageUrl:
        block.contentImageUrl ||
        (contentSourceId ? stableContentImageUrl(contentSourceId) : undefined),
      rssUrl: feedUrl || block.rssUrl,
      rssItems: block.rssItems,
    });
  }

  return { blocks: next, sourcesCreated, imagesGenerated: 0 };
}

/** Idempotent: rewrite latest_blogs → dynamic_content and backfill ContentSource/Items. */
export async function migrateLatestBlogsToDynamicContent(): Promise<MigrateLatestBlogsResult> {
  await connectMongoose();

  let employeesUpdated = 0;
  let profilesUpdated = 0;
  let submissionsUpdated = 0;
  let sourcesCreated = 0;
  let imagesGenerated = 0;

  const employees = await EmployeeModel.find({ 'contentBlocks.type': 'latest_blogs' });
  for (const emp of employees) {
    const result = await migrateBlockArray(
      emp.contentBlocks as unknown as LegacyBlock[],
      emp.organizationId,
      emp.userId || ''
    );
    emp.contentBlocks = result.blocks as typeof emp.contentBlocks;
    emp.markModified('contentBlocks');
    await emp.save();
    employeesUpdated += 1;
    sourcesCreated += result.sourcesCreated;
    imagesGenerated += result.imagesGenerated;
  }

  const profiles = await UserSignatureProfileModel.find({
    'contentBlocks.type': 'latest_blogs',
  }).lean();
  for (const profile of profiles) {
    const userId = String((profile as { userId?: string }).userId || '');
    let organizationId: string | undefined;
    if (userId) {
      const db = getMongoDb();
      const user = await db.collection(AUTH_USER_COLLECTION).findOne({ id: userId });
      organizationId = user?.organizationId ? String(user.organizationId) : undefined;
    }
    const result = await migrateBlockArray(
      (profile as { contentBlocks?: LegacyBlock[] }).contentBlocks,
      organizationId,
      userId
    );
    await UserSignatureProfileModel.updateOne(
      { _id: (profile as { _id: mongoose.Types.ObjectId })._id },
      { $set: { contentBlocks: result.blocks } }
    );
    profilesUpdated += 1;
    sourcesCreated += result.sourcesCreated;
    imagesGenerated += result.imagesGenerated;
  }

  const db = getMongoDb();
  const submissions = await db
    .collection('campaignsubmissions')
    .find({ 'contentBlocks.type': 'latest_blogs' })
    .toArray();
  for (const sub of submissions) {
    const result = await migrateBlockArray(
      sub.contentBlocks as LegacyBlock[],
      sub.organizationId,
      ''
    );
    await db.collection('campaignsubmissions').updateOne(
      { _id: sub._id },
      { $set: { contentBlocks: result.blocks } }
    );
    submissionsUpdated += 1;
    sourcesCreated += result.sourcesCreated;
    imagesGenerated += result.imagesGenerated;
  }

  return {
    employeesUpdated,
    profilesUpdated,
    submissionsUpdated,
    sourcesCreated,
    imagesGenerated,
  };
}
