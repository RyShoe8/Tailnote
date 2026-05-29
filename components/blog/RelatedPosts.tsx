import Link from 'next/link';
import { BlogCard } from '@/components/blog/BlogCard';
import type { BlogPostListItem } from '@/lib/blog/types';

type RelatedPostsProps = {
  posts: BlogPostListItem[];
};

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16 border-t border-slate-200/80 pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">Related reading</h2>
      <p className="mt-2 text-muted-foreground">
        More guides on email signatures, deliverability, and team branding.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
      <p className="mt-8 text-center">
        <Link href="/blog" className="text-sm font-medium text-primary hover:underline">
          View all articles →
        </Link>
      </p>
    </section>
  );
}
