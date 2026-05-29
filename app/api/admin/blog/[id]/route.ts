import { NextResponse } from 'next/server';
import { deleteBlogPost, getBlogPostById, updateBlogPost } from '@/lib/admin/blogPosts';
import { revalidateBlogPaths } from '@/lib/blog/revalidateBlog';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const post = await getBlogPostById(id);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  return NextResponse.json({ post });
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const post = await updateBlogPost(id, json);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    await revalidateBlogPaths({ slug: post.slug });
    return NextResponse.json({ post });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const existing = await getBlogPostById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const deleted = await deleteBlogPost(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }

  await revalidateBlogPaths({ slug: existing.slug });
  return NextResponse.json({ ok: true });
}
