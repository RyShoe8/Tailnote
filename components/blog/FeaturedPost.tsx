import Link from 'next/link';
import type { BlogPostListItem } from '@/lib/blog/types';
import { ReadingTimeBadge } from '@/components/blog/ReadingTimeBadge';
import { CategoryPill } from '@/components/blog/CategoryPill';
import { Button } from '@/components/ui/button';

type FeaturedPostProps = {
  post: BlogPostListItem;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function FeaturedPost({ post }: FeaturedPostProps) {
  return (
    <section className="container pb-10">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-card shadow-card">
        <div className="grid lg:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Featured</p>
            <div className="mt-3">
              <CategoryPill category={post.category} />
            </div>
            <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                {post.title}
              </Link>
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">{post.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              <ReadingTimeBadge readingTime={post.readingTime} />
            </div>
            <div className="mt-8">
              <Button asChild>
                <Link href={`/blog/${post.slug}`}>Read article</Link>
              </Button>
            </div>
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="relative min-h-[240px] bg-gradient-to-br from-primary/15 via-secondary/15 to-[#4fd6b2]/20 lg:min-h-full"
            aria-hidden
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-primary/20">TN</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
