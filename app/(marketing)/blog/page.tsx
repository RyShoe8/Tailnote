import { BlogHero } from '@/components/blog/BlogHero';
import { BlogIndexClient } from '@/components/blog/BlogIndexClient';
import { BlogIndexCta } from '@/components/blog/BlogIndexCta';
import { FeaturedPost } from '@/components/blog/FeaturedPost';
import { NewsletterSignup } from '@/components/blog/NewsletterSignup';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  getAllCategories,
  getAllTags,
  getFeaturedPost,
  getPublishedPosts,
  toListItem,
} from '@/lib/blog/loadPosts';
import { blogBreadcrumbJsonLd, webPageJsonLd } from '@/lib/seo/jsonLd';
import { createBlogIndexMetadata } from '@/lib/seo/blogMetadata';

export const metadata = createBlogIndexMetadata();

export default async function BlogIndexPage() {
  const posts = (await getPublishedPosts()).map(toListItem);
  const featured = await getFeaturedPost();
  const featuredItem = featured ? toListItem(featured) : null;
  const categories = await getAllCategories();
  const tags = await getAllTags();

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: '/blog',
            name: 'Tailnote Blog',
            description:
              'Guides on email signatures, deliverability, and branded outbound email for small teams.',
          }),
          blogBreadcrumbJsonLd({
            items: [
              { name: 'Home', path: '/' },
              { name: 'Blog', path: '/blog' },
            ],
          }),
        ]}
      />
      <BlogHero />
      {featuredItem ? <FeaturedPost post={featuredItem} /> : null}
      <BlogIndexClient
        posts={posts}
        categories={categories}
        tags={tags}
        featuredSlug={featuredItem?.slug}
      />
      <div className="container pb-16">
        <NewsletterSignup variant="compact" signupPage="/blog" />
      </div>
      <BlogIndexCta />
    </>
  );
}
