import Link from 'next/link';
import { AdminBlogPostsTable } from '@/components/admin/AdminBlogPostsTable';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';
import { listBlogPostsAdmin } from '@/lib/admin/blogPosts';

export const metadata = NOINDEX_METADATA;
export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const posts = await listBlogPostsAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage blog posts for{' '}
          <Link href="/blog" className="text-primary hover:underline">
            tailnote.io/blog
          </Link>
          .
        </p>
      </div>
      <AdminBlogPostsTable initialPosts={posts} />
    </div>
  );
}
