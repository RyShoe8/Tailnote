import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { ContentSourceModel } from '@/models/ContentSource';
import { ContentItemModel } from '@/models/ContentItem';
import { regenerateContentImage } from '@/lib/dynamic-content/syncSource';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Stable Dynamic Content image URL.
 * Path never changes; bytes update when content regenerates.
 */
export async function GET(_request: Request, context: Ctx) {
  const raw = (await context.params).id.replace(/\.png$/i, '');
  if (!mongoose.Types.ObjectId.isValid(raw)) {
    return new NextResponse('Not found', { status: 404 });
  }

  await connectMongoose();
  const source = await ContentSourceModel.findById(raw);
  if (!source) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Prefer redirect to Blob (CDN). Regenerate only if items exist but no blob yet.
  if (!source.imageBlobUrl) {
    const count = await ContentItemModel.countDocuments({ contentSourceId: source._id });
    if (count > 0) {
      try {
        await regenerateContentImage(String(source._id));
        const refreshed = await ContentSourceModel.findById(raw);
        if (refreshed?.imageBlobUrl) {
          return NextResponse.redirect(refreshed.imageBlobUrl, 302);
        }
      } catch {
        /* fall through */
      }
    }
    return new NextResponse('Image not ready', { status: 404 });
  }

  const headers = new Headers({
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  });
  if (source.imageContentHash) {
    headers.set('ETag', `"${source.imageContentHash}"`);
  }

  return NextResponse.redirect(source.imageBlobUrl, {
    status: 302,
    headers,
  });
}
