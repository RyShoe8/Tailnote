import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { fetchManualRss } from '@/lib/dynamic-content/registry';

type SessionUser = { organizationId?: string };

/** @deprecated Prefer /api/dashboard/dynamic-content/detect — kept for compatibility. */
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const feedUrl = body.url?.trim();
  if (!feedUrl) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }
  try {
    new URL(feedUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const result = await fetchManualRss(feedUrl);
  if (result.kind === 'error') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.kind === 'not_modified') {
    return NextResponse.json({ items: [] });
  }
  return NextResponse.json({
    items: result.items.map((i) => ({
      title: i.title,
      url: i.url,
      imageUrl: i.imageUrl,
      pubDate: i.pubDate,
    })),
  });
}
