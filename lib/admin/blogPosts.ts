import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { computeReadingTime } from '@/lib/blog/readingTime';
import type { AdminBlogPostRow, BlogPostMeta, BlogPostWithBody } from '@/lib/blog/types';
import {
  blogPostCreateSchema,
  blogPostUpdateSchema,
  type BlogPostFrontmatter,
} from '@/lib/blog/types';
import { BlogPostModel, type BlogPostDoc } from '@/models/BlogPost';

function toIsoDate(value: string | Date | undefined | null): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

function docToMeta(doc: BlogPostDoc, bodyForReadingTime?: string): BlogPostMeta {
  const body = bodyForReadingTime ?? doc.body ?? '';
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
    readingTime: computeReadingTime(body),
    isDraft: doc.draft === true,
    source: 'mongo',
  };
}

function docToAdminRow(doc: BlogPostDoc): AdminBlogPostRow {
  return docToMeta(doc);
}

export async function listBlogPostsAdmin(): Promise<AdminBlogPostRow[]> {
  await connectMongoose();
  const docs = await BlogPostModel.find({})
    .select('-body')
    .sort({ publishedAt: -1 })
    .lean<BlogPostDoc[]>();
  return docs.map((doc) => docToAdminRow(doc as BlogPostDoc));
}

export async function getBlogPostById(id: string): Promise<BlogPostWithBody | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectMongoose();
  const doc = await BlogPostModel.findById(id).lean<BlogPostDoc | null>();
  if (!doc) return null;
  return { ...docToMeta(doc as BlogPostDoc, doc.body), body: doc.body };
}

export async function getBlogPostBySlugAdmin(slug: string): Promise<BlogPostWithBody | null> {
  await connectMongoose();
  const doc = await BlogPostModel.findOne({ slug: slug.toLowerCase() }).lean<BlogPostDoc | null>();
  if (!doc) return null;
  return { ...docToMeta(doc as BlogPostDoc, doc.body), body: doc.body };
}

export async function createBlogPost(input: unknown): Promise<BlogPostWithBody> {
  const parsed = blogPostCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join('; ') || 'Invalid post');
  }

  const data = parsed.data;
  await connectMongoose();

  const existing = await BlogPostModel.findOne({ slug: data.slug }).select('_id').lean();
  if (existing) {
    throw new Error('A post with this slug already exists');
  }

  const now = new Date().toISOString().slice(0, 10);
  const doc = await BlogPostModel.create({
    slug: data.slug,
    title: data.title,
    description: data.description,
    publishedAt: data.publishedAt,
    contentUpdatedAt: data.updatedAt ?? now,
    author: data.author,
    category: data.category,
    coverImage: data.coverImage ?? '',
    seoTitle: data.seoTitle ?? '',
    seoDescription: data.seoDescription ?? '',
    canonicalUrl: data.canonicalUrl ?? '',
    featured: data.featured ?? false,
    draft: data.draft ?? false,
    tags: data.tags ?? [],
    body: data.body,
  });

  return { ...docToMeta(doc, doc.body), body: doc.body };
}

export async function updateBlogPost(id: string, input: unknown): Promise<BlogPostWithBody | null> {
  if (!mongoose.isValidObjectId(id)) return null;

  const parsed = blogPostUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join('; ') || 'Invalid post');
  }

  await connectMongoose();
  const doc = await BlogPostModel.findById(id);
  if (!doc) return null;

  const data = parsed.data;
  if (data.title !== undefined) doc.title = data.title;
  if (data.description !== undefined) doc.description = data.description;
  if (data.publishedAt !== undefined) doc.publishedAt = data.publishedAt;
  if (data.author !== undefined) doc.author = data.author;
  if (data.category !== undefined) doc.category = data.category;
  if (data.coverImage !== undefined) doc.coverImage = data.coverImage ?? '';
  if (data.seoTitle !== undefined) doc.seoTitle = data.seoTitle ?? '';
  if (data.seoDescription !== undefined) doc.seoDescription = data.seoDescription ?? '';
  if (data.canonicalUrl !== undefined) doc.canonicalUrl = data.canonicalUrl ?? '';
  if (data.featured !== undefined) doc.featured = data.featured;
  if (data.draft !== undefined) doc.draft = data.draft;
  if (data.tags !== undefined) doc.tags = data.tags;
  if (data.body !== undefined) doc.body = data.body;

  if (data.updatedAt !== undefined) {
    doc.contentUpdatedAt = data.updatedAt;
  } else if (data.body !== undefined || data.title !== undefined) {
    doc.contentUpdatedAt = new Date().toISOString().slice(0, 10);
  }

  await doc.save();
  return { ...docToMeta(doc, doc.body), body: doc.body };
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  if (!mongoose.isValidObjectId(id)) return false;
  await connectMongoose();
  const result = await BlogPostModel.findByIdAndDelete(id);
  return Boolean(result);
}

export async function upsertBlogPostFromMigration(input: {
  frontmatter: BlogPostFrontmatter & { slug: string };
  body: string;
}): Promise<void> {
  await connectMongoose();
  const { frontmatter, body } = input;
  await BlogPostModel.findOneAndUpdate(
    { slug: frontmatter.slug },
    {
      slug: frontmatter.slug,
      title: frontmatter.title,
      description: frontmatter.description,
      publishedAt: frontmatter.publishedAt,
      contentUpdatedAt: frontmatter.updatedAt ?? frontmatter.publishedAt,
      author: frontmatter.author,
      category: frontmatter.category,
      coverImage: frontmatter.coverImage ?? '',
      seoTitle: frontmatter.seoTitle ?? '',
      seoDescription: frontmatter.seoDescription ?? '',
      canonicalUrl: frontmatter.canonicalUrl ?? '',
      featured: frontmatter.featured ?? false,
      draft: frontmatter.draft ?? false,
      tags: frontmatter.tags ?? [],
      body,
    },
    { upsert: true, new: true }
  );
}

export { toIsoDate };
