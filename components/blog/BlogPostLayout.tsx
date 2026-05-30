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

      <div className="container pb-16 sm:pb-20">
        <div className="mx-auto grid max-w-6xl lg:grid-cols-[1fr_minmax(0,48rem)_1fr] lg:gap-x-12">
          <div className="hidden lg:block" aria-hidden="true" />
          <div className="min-w-0">
            <header className="py-10 sm:py-14">
              <CategoryPill category={post.category} />
              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>
              <p className="mt-4 text-pretty text-lg text-muted-foreground">{post.description}</p>
              {post.coverImage ? (
                <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImage}
                    alt=""
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
              ) : null}
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
            </header>

            <div className="blog-prose">{content}</div>
            <div className="mt-12">
              <AuthorCard authorId={post.author} />
            </div>
            <div className="mt-12">
              <NewsletterSignup variant="full" signupPage={path} />
            </div>
            <RelatedPosts posts={relatedPosts} />
          </div>
          <aside className="hidden min-w-0 lg:block">
            <TableOfContents headings={headings} />
          </aside>
        </div>
        <div className="mx-auto mt-8 max-w-3xl lg:hidden">
          <TableOfContents headings={headings} />
        </div>
      </div>

      <StickyCTA />

      <nav className="container border-t border-slate-200/80 py-8 text-sm text-muted-foreground">
        <div className="mx-auto max-w-3xl">
          <Link href="/blog" className="font-medium text-primary hover:underline">
            ← Back to blog
          </Link>
        </div>
      </nav>
    </article>
  );
}
