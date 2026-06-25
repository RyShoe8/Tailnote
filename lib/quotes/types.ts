import { z } from 'zod';

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const quoteCategoryCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).regex(SLUG_RE).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const quoteCategoryUpdateSchema = quoteCategoryCreateSchema.partial();

export const quoteCreateSchema = z.object({
  quoteText: z.string().min(1).max(2000),
  attribution: z.string().max(200).optional(),
  source: z.string().max(200).optional(),
  sourceUrl: z.string().max(2000).optional().or(z.literal('')),
  categoryId: z.string().min(1),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const quoteUpdateSchema = quoteCreateSchema.partial();

export type QuoteCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type QuoteRow = {
  id: string;
  quoteText: string;
  attribution: string;
  source: string;
  sourceUrl: string;
  categoryId: string;
  categoryName: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type QuoteListItem = Pick<
  QuoteRow,
  'id' | 'quoteText' | 'attribution' | 'source' | 'sourceUrl' | 'categoryId' | 'categoryName' | 'isFeatured'
>;

export type QuoteListResponse = {
  quotes: QuoteListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function slugifyQuoteCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
