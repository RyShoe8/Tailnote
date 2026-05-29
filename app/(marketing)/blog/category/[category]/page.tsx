import { notFound } from 'next/navigation';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogHero } from '@/components/blog/BlogHero';
import { JsonLd } from '@/components/seo/JsonLd';
import { getAllCategories, getPostsByCategory, toListItem } from '@/lib/blog/loadPosts';
import { getCategoryLabel } from '@/lib/blog/categories';
import { createBlogCategoryMetadata } from '@/lib/seo/blogMetadata';
import { blogBreadcrumbJsonLd, webPageJsonLd } from '@/lib/seo/jsonLd';

type PageProps = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps) {
  const { category } = await params;
  const posts = await getPostsByCategory(category);
  if (posts.length === 0) return {};
  return createBlogCategoryMetadata(category, posts.length);
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const posts = await getPostsByCategory(category);

  if (posts.length === 0) notFound();

  const label = getCategoryLabel(category);

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: `/blog/category/${category}`,
            name: `${label} — Tailnote Blog`,
            description: `Articles about ${label.toLowerCase()} for small teams.`,
          }),
          blogBreadcrumbJsonLd({
            items: [
              { name: 'Home', path: '/' },
              { name: 'Blog', path: '/blog' },
              { name: label, path: `/blog/category/${category}` },
            ],
          }),
        ]}
      />
      <BlogHero />
      <section className="container pb-16 sm:pb-20">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Category</p>
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
