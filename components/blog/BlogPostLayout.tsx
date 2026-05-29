import Link from 'next/link';
import { CategoryPill } from '@/components/blog/CategoryPill';
import { AuthorCard } from '@/components/blog/AuthorCard';
import { ReadingTimeBadge } from '@/components/blog/ReadingTimeBadge';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { StickyCTA } from '@/components/blog/StickyCTA';
import { NewsletterSignup } from '@/components/blog/NewsletterSignup';
import type { BlogPostMeta } from '@/lib/blog/types';
import type { BlogPostListItem } from '@/lib/blog/types';
import type { TocHeading } from '@/lib/blog/types';

type BlogPostLayoutProps = {
  post: BlogPostMeta;
  content: React.ReactElement;
  headings: TocHeading[];
  relatedPosts: BlogPostListItem[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function BlogPostLayout({ post, content, headings, relatedPosts }: BlogPostLayoutProps) {
  const path = `/blog/${post.slug}`;

  return (
    <article>
      {post.isDraft ? (
        <div className="border-b border-amber-200 bg-amber-50 py-2 text-center text-sm font-medium text-amber-800">
          Draft preview — not visible in production listings
        </div>
      ) : null}

      <header className="container py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <CategoryPill category={post.category} />
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">{post.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <time dateTime={post.publishedAt}>Published {formatDate(post.publishedAt)}</time>
            {post.updatedAt ? (
              <time dateTime={post.updatedAt}>Updated {formatDate(post.updatedAt)}</time>
            ) : null}
            <ReadingTimeBadge readingTime={post.readingTime} />
          </div>
          <div className="mt-6">
            <ShareButtons title={post.title} path={path} />
          </div>
        </div>
      </header>

      <div className="container pb-16 sm:pb-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-12">
          <div className="min-w-0">
            <div className="blog-prose mx-auto max-w-3xl">{content}</div>
            <div className="mx-auto mt-12 max-w-3xl">
              <AuthorCard authorId={post.author} />
            </div>
            <div className="mx-auto mt-12 max-w-3xl">
              <NewsletterSignup variant="full" signupPage={path} />
            </div>
            <div className="mx-auto max-w-3xl">
              <RelatedPosts posts={relatedPosts} />
            </div>
          </div>
          <aside className="hidden lg:block">
            <TableOfContents headings={headings} />
          </aside>
        </div>
        <div className="mx-auto mt-8 max-w-3xl lg:hidden">
          <TableOfContents headings={headings} />
        </div>
      </div>

      <StickyCTA />

      <nav className="container border-t border-slate-200/80 py-8 text-sm text-muted-foreground">
        <Link href="/blog" className="font-medium text-primary hover:underline">
          ← Back to blog
        </Link>
      </nav>
    </article>
  );
}
