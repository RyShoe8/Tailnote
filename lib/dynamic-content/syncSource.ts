import 'server-only';
import { createHash } from 'crypto';
import { put } from '@vercel/blob';
import mongoose from 'mongoose';
import { ContentItemModel } from '@/models/ContentItem';
import { ContentSourceModel, type ContentDetectionMethod } from '@/models/ContentSource';
import { OrganizationModel } from '@/models/Organization';
import { autoDetectContent, fetchContentSource, fetchManualRss } from '@/lib/dynamic-content/registry';
import { renderDynamicContentCardPng } from '@/lib/dynamic-content/renderCard';
import type { ParsedFeedItem } from '@/lib/dynamic-content/parseFeed';
import { normalizeWebsiteUrl } from '@/lib/dynamic-content/types';
import { stableContentImageUrl } from '@/lib/dynamic-content/urls';

export { stableContentImageUrl } from '@/lib/dynamic-content/urls';

function itemGuid(item: ParsedFeedItem): string {
  return (item.guid || item.url || item.title).trim();
}

function itemsContentFingerprint(items: ParsedFeedItem[], postsToDisplay: number): string {
  const slice = items.slice(0, postsToDisplay).map((i) => `${itemGuid(i)}|${i.title}|${i.url}`);
  return createHash('sha256').update(slice.join('\n')).digest('hex');
}

async function upsertItems(contentSourceId: mongoose.Types.ObjectId, items: ParsedFeedItem[]) {
  for (const item of items.slice(0, 10)) {
    const guid = itemGuid(item);
    const publishedAt = item.pubDate ? new Date(item.pubDate) : undefined;
    await ContentItemModel.findOneAndUpdate(
      { contentSourceId, guid },
      {
        $set: {
          title: item.title,
          url: item.url,
          imageUrl: item.imageUrl || '',
          description: item.description || '',
          publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : undefined,
        },
      },
      { upsert: true }
    );
  }
}

async function uploadContentImage(
  organizationId: string,
  contentSourceId: string,
  buffer: Buffer
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    // Dev fallback: data URL not usable in email; keep empty and rely on on-demand generate in route
    return '';
  }
  const pathname = `tailnote/orgs/${organizationId}/dynamic-content/${contentSourceId}.png`;
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType: 'image/png',
    token,
    allowOverwrite: true,
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function regenerateContentImage(contentSourceId: string): Promise<{
  imageBlobUrl: string;
  contentImageUrl: string;
  contentHash: string;
}> {
  const source = await ContentSourceModel.findById(contentSourceId);
  if (!source) throw new Error('Content source not found');

  const items = await ContentItemModel.find({ contentSourceId: source._id })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(5)
    .lean();

  const cardItems = items.map((i) => ({ title: String(i.title) }));
  const posts = Math.min(3, Math.max(1, Number(source.postsToDisplay) || 1)) as 1 | 2 | 3;

  const org = (await OrganizationModel.findById(source.organizationId)
    .select('fontFamily')
    .lean()) as { fontFamily?: string } | null;

  const { buffer, contentHash } = await renderDynamicContentCardPng(cardItems, posts, {
    fontFamily: org?.fontFamily,
  });

  if (source.imageContentHash === contentHash && source.imageBlobUrl) {
    return {
      imageBlobUrl: source.imageBlobUrl,
      contentImageUrl: stableContentImageUrl(String(source._id)),
      contentHash,
    };
  }

  const imageBlobUrl = await uploadContentImage(
    String(source.organizationId),
    String(source._id),
    buffer
  );

  source.imageBlobUrl = imageBlobUrl || source.imageBlobUrl;
  source.imageContentHash = contentHash;
  source.imageGeneratedAt = new Date();
  await source.save();

  return {
    imageBlobUrl: source.imageBlobUrl,
    contentImageUrl: stableContentImageUrl(String(source._id)),
    contentHash,
  };
}

export type EnsureSourceInput = {
  organizationId: string;
  ownerUserId?: string;
  websiteUrl?: string;
  feedUrl?: string;
  detectionMode: 'auto' | 'rss';
  postsToDisplay: 1 | 2 | 3;
  existingSourceId?: string;
};

export async function ensureAndRefreshContentSource(input: EnsureSourceInput): Promise<{
  contentSourceId: string;
  contentImageUrl: string;
  websiteUrl: string;
  feedUrl: string;
  detectionMethod: ContentDetectionMethod;
  items: ParsedFeedItem[];
  status: string;
}> {
  const websiteUrl =
    normalizeWebsiteUrl(input.websiteUrl || '') ||
    normalizeWebsiteUrl(input.feedUrl || '');
  let feedUrl = (input.feedUrl || '').trim();
  let detectionMethod: ContentDetectionMethod = 'rss_manual';
  let items: ParsedFeedItem[] = [];
  let etag = '';
  let lastModified = '';

  if (input.detectionMode === 'rss') {
    if (!feedUrl) throw new Error('Feed URL is required for RSS mode');
    const result = await fetchManualRss(feedUrl);
    if (result.kind === 'error') throw new Error(result.message);
    if (result.kind === 'not_modified') {
      /* keep empty items — load from DB below */
    } else {
      items = result.items;
      etag = result.etag || '';
      lastModified = result.lastModified || '';
      feedUrl = result.feedUrl || feedUrl;
      detectionMethod = 'rss_manual';
    }
  } else {
    const detected = await autoDetectContent(websiteUrl || feedUrl);
    if (!detected) throw new Error('Could not detect content for this website');
    items = detected.items;
    feedUrl = detected.feedUrl;
    detectionMethod = detected.detectionMethod;
    etag = detected.etag || '';
    lastModified = detected.lastModified || '';
  }

  let source = input.existingSourceId
    ? await ContentSourceModel.findById(input.existingSourceId)
    : null;

  if (!source) {
    source = await ContentSourceModel.create({
      organizationId: new mongoose.Types.ObjectId(input.organizationId),
      ownerUserId: input.ownerUserId || '',
      websiteUrl,
      feedUrl,
      detectionMethod,
      etag,
      lastModified,
      lastFetchedAt: new Date(),
      status: 'ok',
      consecutiveFailures: 0,
      postsToDisplay: input.postsToDisplay,
    });
  } else {
    source.websiteUrl = websiteUrl || source.websiteUrl;
    source.feedUrl = feedUrl || source.feedUrl;
    source.detectionMethod = detectionMethod;
    source.postsToDisplay = input.postsToDisplay;
    if (etag) source.etag = etag;
    if (lastModified) source.lastModified = lastModified;
    source.lastFetchedAt = new Date();
    source.status = 'ok';
    source.consecutiveFailures = 0;
    await source.save();
  }

  if (items.length) {
    await upsertItems(source._id, items);
  }

  const stored = await ContentItemModel.find({ contentSourceId: source._id })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(5)
    .lean();

  const parsedStored: ParsedFeedItem[] = stored.map((i) => ({
    title: String(i.title),
    url: String(i.url),
    imageUrl: i.imageUrl || undefined,
    guid: String(i.guid),
    pubDate: i.publishedAt ? new Date(i.publishedAt).toISOString() : undefined,
  }));

  await regenerateContentImage(String(source._id));

  return {
    contentSourceId: String(source._id),
    contentImageUrl: stableContentImageUrl(String(source._id)),
    websiteUrl: source.websiteUrl,
    feedUrl: source.feedUrl,
    detectionMethod: source.detectionMethod as ContentDetectionMethod,
    items: parsedStored.length ? parsedStored : items,
    status: source.status,
  };
}

export async function refreshExistingContentSource(contentSourceId: string): Promise<{
  changed: boolean;
  contentImageUrl: string;
  status: string;
  error?: string;
}> {
  const source = await ContentSourceModel.findById(contentSourceId);
  if (!source) throw new Error('Content source not found');

  const prevFp = itemsContentFingerprint(
    (
      await ContentItemModel.find({ contentSourceId: source._id })
        .sort({ publishedAt: -1 })
        .limit(5)
        .lean()
    ).map((i) => ({
      title: String(i.title),
      url: String(i.url),
      guid: String(i.guid),
    })),
    Number(source.postsToDisplay) || 1
  );

  const result = await fetchContentSource({
    websiteUrl: source.websiteUrl,
    feedUrl: source.feedUrl,
    etag: source.etag,
    lastModified: source.lastModified,
    detectionMethod: source.detectionMethod,
  });

  if (result.kind === 'error') {
    source.consecutiveFailures = (source.consecutiveFailures || 0) + 1;
    source.status = 'error';
    source.lastFetchedAt = new Date();
    await source.save();
    return {
      changed: false,
      contentImageUrl: stableContentImageUrl(String(source._id)),
      status: 'error',
      error: result.message,
    };
  }

  if (result.kind === 'not_modified') {
    source.lastFetchedAt = new Date();
    source.status = 'ok';
    source.consecutiveFailures = 0;
    await source.save();
    return {
      changed: false,
      contentImageUrl: stableContentImageUrl(String(source._id)),
      status: 'ok',
    };
  }

  if (result.feedUrl) source.feedUrl = result.feedUrl;
  if (result.detectionMethod) source.detectionMethod = result.detectionMethod;
  if (result.etag) source.etag = result.etag;
  if (result.lastModified) source.lastModified = result.lastModified;
  source.lastFetchedAt = new Date();
  source.status = 'ok';
  source.consecutiveFailures = 0;
  await source.save();

  await upsertItems(source._id, result.items);
  const nextFp = itemsContentFingerprint(result.items, Number(source.postsToDisplay) || 1);
  const changed = nextFp !== prevFp || !source.imageBlobUrl;
  if (changed) {
    await regenerateContentImage(String(source._id));
  }

  return {
    changed,
    contentImageUrl: stableContentImageUrl(String(source._id)),
    status: 'ok',
  };
}
