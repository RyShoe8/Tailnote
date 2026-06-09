import type { MetadataRoute } from 'next';
import { connectMongoose } from '@/lib/mongoose';
import { computeReadingTime } from '@/lib/blog/readingTime';
import { truncateBlogDescription } from '@/lib/blog/truncateDescription';
import type { BlogPostListItem, BlogPostMeta, BlogPostWithBody } from '@/lib/blog/types';
import { BlogPostModel, type BlogPostDoc } from '@/models/BlogPost';
import { absoluteUrl } from '@/lib/seo/site';

async function ensureDb(): Promise<boolean> {
  if (!process.env.MONGODB_URI?.trim()) return false;
  try {
    await connectMongoose();
    return true;
  } catch {
    return false;
  }
}

function docToMeta(doc: BlogPostDoc, body?: string): BlogPostMeta {
  const content = body ?? doc.body ?? '';
  const updatedAt = doc.contentUpdatedAt?.trim() || undefined;

  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    publishedAt: doc.publishedAt,
    updatedAt,
    author: doc.author,
    category: doc.category,
    coverImage: doc.coverImage || undefined,
    seoTitle: doc.seoTitle || undefined,
    seoDescription: doc.seoDescription || undefined,
    canonicalUrl: doc.canonicalUrl || undefined,
    featured: doc.featured,
    draft: doc.draft,
    tags: doc.tags?.length ? doc.tags : undefined,
    readingTime: computeReadingTime(content),
    isDraft: doc.draft === true,
    source: 'mongo',
  };
}

function sortByDate(posts: BlogPostMeta[]): BlogPostMeta[] {
  return [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

async function fetchAllMeta(includeDraftsInDev: boolean): Promise<BlogPostMeta[]> {
  if (!(await ensureDb())) return [];

  const query =
    includeDraftsInDev && process.env.NODE_ENV === 'development'
      ? {}
      : { draft: { $ne: true } };

  const docs = await BlogPostModel.find(query).lean<BlogPostDoc[]>();
  return sortByDate(docs.map((doc) => docToMeta(doc as BlogPostDoc, doc.body)));
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  return fetchAllMeta(true);
}

export async function getPublishedPosts(): Promise<BlogPostMeta[]> {
  if (!(await ensureDb())) return [];

  const docs = await BlogPostModel.find({ draft: { $ne: true } }).lean<BlogPostDoc[]>();
  return sortByDate(docs.map((doc) => docToMeta(doc as BlogPostDoc, doc.body)));
}

export async function getPostBySlug(slug: string): Promise<BlogPostMeta | null> {
  if (!(await ensureDb())) return null;

  const doc = await BlogPostModel.findOne({ slug }).lean<BlogPostDoc | null>();
  if (!doc) return null;
  return docToMeta(doc as BlogPostDoc, doc.body);
}

export async function getPostWithBody(slug: string): Promise<BlogPostWithBody | null> {
  if (!(await ensureDb())) return null;

  const doc = await BlogPostModel.findOne({ slug }).lean<BlogPostDoc | null>();
  if (!doc) return null;
  return { ...docToMeta(doc as BlogPostDoc, doc.body), body: doc.body };
}

export async function getPostBody(slug: string): Promise<string | null> {
  if (!(await ensureDb())) return null;

  const doc = await BlogPostModel.findOne({ slug }).select('body').lean<{ body: string } | null>();
  return doc?.body ?? null;
}

export async function getFeaturedPost(): Promise<BlogPostMeta | null> {
  const published = await getPublishedPosts();
  const featured = published.filter((p) => p.featured);
  return featured[0] ?? null;
}

export async function getPostsByCategory(category: string): Promise<BlogPostMeta[]> {
  const published = await getPublishedPosts();
  return published.filter((p) => p.category === category);
}

export async function getPostsByTag(tag: string): Promise<BlogPostMeta[]> {
  const published = await getPublishedPosts();
  return published.filter((p) => p.tags?.includes(tag));
}

export async function getAllCategories(): Promise<string[]> {
  const published = await getPublishedPosts();
  const cats = new Set(published.map((p) => p.category));
  return [...cats].sort();
}

export async function getAllTags(): Promise<string[]> {
  const published = await getPublishedPosts();
  const tags = new Set<string>();
  for (const post of published) {
    for (const tag of post.tags ?? []) {
      tags.add(tag);
    }
  }
  return [...tags].sort();
}

export function toListItem(post: BlogPostMeta): BlogPostListItem {
  return {
    slug: post.slug,
    title: post.title,
    description: truncateBlogDescription(post.description),
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    author: post.author,
    category: post.category,
    coverImage: post.coverImage,
    readingTime: post.readingTime,
    featured: post.featured,
    tags: post.tags,
    isDraft: post.isDraft,
  };
}

export async function blogSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/blog'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
  ];

  const published = await getPublishedPosts();
  for (const post of published) {
    entries.push({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  const categories = await getAllCategories();
  for (const category of categories) {
    entries.push({
      url: absoluteUrl(`/blog/category/${category}`),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  const tags = await getAllTags();
  for (const tag of tags) {
    entries.push({
      url: absoluteUrl(`/blog/tag/${tag}`),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  return entries;
}
