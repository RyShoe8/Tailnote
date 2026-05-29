import { z } from 'zod';

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const blogPostFrontmatterSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).regex(SLUG_RE).optional(),
  description: z.string().min(1).max(500),
  publishedAt: z.string().min(1),
  updatedAt: z.string().optional(),
  author: z.string().min(1),
  category: z.string().min(1),
  coverImage: z.string().optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  featured: z.boolean().optional(),
  draft: z.boolean().optional(),
  readingTime: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const blogPostBodySchema = z.object({
  body: z.string().max(200_000),
});

export const blogPostCreateSchema = blogPostFrontmatterSchema
  .required({ slug: true })
  .extend({
    slug: z.string().min(1).regex(SLUG_RE),
    body: z.string().max(200_000),
  });

export const blogPostUpdateSchema = blogPostFrontmatterSchema
  .partial()
  .extend({
    body: z.string().max(200_000).optional(),
  });

export type BlogPostFrontmatter = z.infer<typeof blogPostFrontmatterSchema>;

export type BlogPostMeta = BlogPostFrontmatter & {
  id: string;
  slug: string;
  readingTime: string;
  isDraft: boolean;
  source: 'mongo';
};

export type BlogPostWithBody = BlogPostMeta & {
  body: string;
};

export type TocHeading = {
  level: 2 | 3;
  text: string;
  id: string;
};

export type BlogAuthor = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
};

export type BlogPostListItem = Pick<
  BlogPostMeta,
  | 'slug'
  | 'title'
  | 'description'
  | 'publishedAt'
  | 'updatedAt'
  | 'author'
  | 'category'
  | 'coverImage'
  | 'readingTime'
  | 'featured'
  | 'tags'
  | 'isDraft'
>;

export type AdminBlogPostRow = BlogPostListItem & {
  id: string;
};
