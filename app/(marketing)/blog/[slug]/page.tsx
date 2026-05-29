import { notFound } from 'next/navigation';
import { BlogPostLayout } from '@/components/blog/BlogPostLayout';
import { JsonLd } from '@/components/seo/JsonLd';
import { compilePost } from '@/lib/blog/compilePost';
import { getAuthor } from '@/lib/blog/authors';
import { getPostBySlug, getPublishedPosts } from '@/lib/blog/loadPosts';
import { getRelatedPosts } from '@/lib/blog/relatedPosts';
import { createBlogPostMetadata } from '@/lib/seo/blogMetadata';
import { blogBreadcrumbJsonLd, blogPostingJsonLd } from '@/lib/seo/jsonLd';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  if (post.isDraft && process.env.NODE_ENV === 'production') return {};
  return createBlogPostMetadata(post);
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();
  if (post.isDraft && process.env.NODE_ENV === 'production') notFound();

  const compiled = await compilePost(slug);
  if (!compiled) notFound();

  const author = getAuthor(post.author);
  const relatedPosts = await getRelatedPosts(post);

  return (
    <>
      <JsonLd
        data={[
          blogPostingJsonLd({
            title: post.title,
            description: post.description,
            slug: post.slug,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            authorName: author.name,
            coverImage: post.coverImage,
          }),
          blogBreadcrumbJsonLd({
            items: [
              { name: 'Home', path: '/' },
              { name: 'Blog', path: '/blog' },
              { name: post.title, path: `/blog/${post.slug}` },
            ],
          }),
        ]}
      />
      <BlogPostLayout
        post={post}
        content={compiled.content}
        headings={compiled.headings}
        relatedPosts={relatedPosts}
      />
    </>
  );
}
