import Link from 'next/link';
import type { BlogPostListItem } from '@/lib/blog/types';
import { ReadingTimeBadge } from '@/components/blog/ReadingTimeBadge';
import { CategoryPill } from '@/components/blog/CategoryPill';

type BlogCardProps = {
  post: BlogPostListItem;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-card shadow-card transition-shadow hover:shadow-ring">
      {post.coverImage ? (
        <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
      ) : (
        <Link
          href={`/blog/${post.slug}`}
          className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-[#4fd6b2]/10"
          aria-hidden
        >
          <span className="text-4xl font-semibold text-primary/30">TN</span>
        </Link>
      )}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <CategoryPill category={post.category} />
          {post.isDraft ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Draft
            </span>
          ) : null}
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          <Link href={`/blog/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h2>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{post.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <ReadingTimeBadge readingTime={post.readingTime} />
        </div>
      </div>
    </article>
  );
}
