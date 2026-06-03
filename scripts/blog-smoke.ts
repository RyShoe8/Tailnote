/**
 * Blog content smoke checks (MongoDB source).
 * Run: npm run verify:blog
 */
import { connectMongoose } from '../lib/mongoose';
import {
  getAllCategories,
  getAllTags,
  getPublishedPosts,
  blogSitemapEntries,
} from '../lib/blog/loadPosts';
import { marketingSitemapEntries } from '../lib/seo/marketingPages';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
}

async function main() {
  if (!process.env.MONGODB_URI?.trim()) {
    console.log('SKIP: MONGODB_URI not set — blog smoke checks require MongoDB after migrate:blog');
    return;
  }

  await connectMongoose();

  const posts = await getPublishedPosts();
  assert(posts.length >= 1, `at least 1 published post (got ${posts.length})`);

  const slugs = new Set<string>();
  for (const post of posts) {
    assert(Boolean(post.title), `post ${post.slug} has title`);
    assert(Boolean(post.description), `post ${post.slug} has description`);
    assert(Boolean(post.slug), `post has slug`);
    assert(Boolean(post.id), `post ${post.slug} has mongo id`);
    assert(!slugs.has(post.slug), `unique slug: ${post.slug}`);
    slugs.add(post.slug);
  }

  const featured = posts.filter((p) => p.featured);
  assert(featured.length >= 1, 'at least one featured post');

  assert((await getAllCategories()).length >= 1, 'at least one category');
  assert((await getAllTags()).length >= 1, 'at least one tag');

  const sitemap = [...marketingSitemapEntries(), ...(await blogSitemapEntries())];

  const isBlogIndexUrl = (url: string) => {
    try {
      const path = new URL(url).pathname.replace(/\/$/, '') || '/';
      return path === '/blog';
    } catch {
      return false;
    }
  };
  const blogIndexCount = sitemap.filter((e) => isBlogIndexUrl(e.url)).length;
  assert(blogIndexCount === 1, `sitemap has exactly one /blog index (got ${blogIndexCount})`);
  assert(
    posts.every((p) => sitemap.some((e) => e.url.endsWith(`/blog/${p.slug}`))),
    'sitemap includes all published posts'
  );

  if (process.exitCode) {
    console.error('\nBlog smoke checks failed.');
    process.exit(1);
  }

  console.log('\nAll blog smoke checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
