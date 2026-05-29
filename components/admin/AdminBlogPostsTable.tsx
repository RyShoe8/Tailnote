'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AdminBlogPostRow } from '@/lib/blog/types';
import { getCategoryLabel } from '@/lib/blog/categories';

type Props = {
  initialPosts: AdminBlogPostRow[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function AdminBlogPostsTable({ initialPosts }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch('/api/admin/blog', { credentials: 'include' });
    const j = (await res.json()) as { posts?: AdminBlogPostRow[] };
    if (res.ok && j.posts) setPosts(j.posts);
  }, []);

  async function onDelete(post: AdminBlogPostRow) {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setMsg(null);
    const res = await fetch(`/api/admin/blog/${post.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg(typeof j.error === 'string' ? j.error : 'Delete failed');
      return;
    }
    await reload();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{posts.length} post(s)</p>
        <Button asChild>
          <Link href="/admin/blog/new">New post</Link>
        </Button>
      </div>

      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}

      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Slug</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Published</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-slate-100">
                <td className="px-3 py-3 font-medium text-foreground">{post.title}</td>
                <td className="px-3 py-3 text-muted-foreground">{post.slug}</td>
                <td className="px-3 py-3 text-muted-foreground">{getCategoryLabel(post.category)}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {post.isDraft ? (
                      <Badge variant="outline">Draft</Badge>
                    ) : (
                      <Badge variant="default">Published</Badge>
                    )}
                    {post.featured ? <Badge>Featured</Badge> : null}
                  </div>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{formatDate(post.publishedAt)}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/blog/${post.id}/edit`}>Edit</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/blog/${post.id}/preview`}>Preview</Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void onDelete(post)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
          No posts yet. Create one or run <code className="text-xs">npm run migrate:blog</code> to import
          MDX seed content.
        </p>
      ) : null}
    </div>
  );
}
