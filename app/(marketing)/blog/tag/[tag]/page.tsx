import { notFound } from 'next/navigation';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogHero } from '@/components/blog/BlogHero';
import { JsonLd } from '@/components/seo/JsonLd';
import { getAllTags, getPostsByTag, toListItem } from '@/lib/blog/loadPosts';
import { getTagLabel } from '@/lib/blog/categories';
import { createBlogTagMetadata } from '@/lib/seo/blogMetadata';
import { blogBreadcrumbJsonLd, webPageJsonLd } from '@/lib/seo/jsonLd';

type PageProps = {
  params: Promise<{ tag: string }>;
};

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps) {
  const { tag } = await params;
  const posts = await getPostsByTag(tag);
  if (posts.length === 0) return {};
  return createBlogTagMetadata(tag, posts.length);
}

export default async function BlogTagPage({ params }: PageProps) {
  const { tag } = await params;
  const posts = await getPostsByTag(tag);

  if (posts.length === 0) notFound();

  const label = getTagLabel(tag);

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: `/blog/tag/${tag}`,
            name: `${label} — Tailnote Blog`,
            description: `Guides tagged ${label} for small teams.`,
          }),
          blogBreadcrumbJsonLd({
            items: [
              { name: 'Home', path: '/' },
              { name: 'Blog', path: '/blog' },
              { name: label, path: `/blog/tag/${tag}` },
            ],
          }),
        ]}
      />
      <BlogHero />
      <section className="container pb-16 sm:pb-20">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Tag</p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{label}</h2>
        <p className="mt-2 text-muted-foreground">
          {posts.length} article{posts.length === 1 ? '' : 's'}
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={toListItem(post)} />
          ))}
        </div>
      </section>
    </>
  );
}
