import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlogPostLayout } from '@/components/blog/BlogPostLayout';
import { compilePostContent } from '@/lib/blog/compilePost';
import { getBlogPostById } from '@/lib/admin/blogPosts';
import { getRelatedPosts } from '@/lib/blog/relatedPosts';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';

export const metadata = NOINDEX_METADATA;
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminBlogPreviewPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getBlogPostById(id);
  if (!post) notFound();

  const compiled = await compilePostContent(post.body);
  const relatedPosts = await getRelatedPosts(post);

  return (
    <>
      <div className="border-b border-amber-200 bg-amber-50 py-2 text-center text-sm text-amber-900">
        Admin preview —{' '}
        {post.isDraft ? 'draft (not public)' : 'published on /blog/' + post.slug}.{' '}
        <Link href={`/admin/blog/${id}/edit`} className="font-medium underline">
          Back to edit
        </Link>
      </div>
      <BlogPostLayout
        post={post}
        content={compiled.content}
        headings={compiled.headings}
        relatedPosts={relatedPosts}
      />
    </>
  );
}
