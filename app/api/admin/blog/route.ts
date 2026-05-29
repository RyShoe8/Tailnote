import { NextResponse } from 'next/server';
import { createBlogPost, listBlogPostsAdmin } from '@/lib/admin/blogPosts';
import { revalidateBlogPaths } from '@/lib/blog/revalidateBlog';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const posts = await listBlogPostsAdmin();
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const post = await createBlogPost(json);
    await revalidateBlogPaths({ slug: post.slug });
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
