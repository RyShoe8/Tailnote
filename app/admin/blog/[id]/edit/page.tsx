import { notFound } from 'next/navigation';
import { AdminBlogPostForm } from '@/components/admin/AdminBlogPostForm';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';
import { getBlogPostById } from '@/lib/admin/blogPosts';

export const metadata = NOINDEX_METADATA;
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminBlogEditPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getBlogPostById(id);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit blog post</h1>
        <p className="mt-1 text-sm text-muted-foreground">{post.title}</p>
      </div>
      <AdminBlogPostForm
        mode="edit"
        postId={id}
        initial={{
          ...post,
          isDraft: post.isDraft,
        }}
      />
    </div>
  );
}
