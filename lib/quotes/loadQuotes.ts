import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import type { QuoteListItem, QuoteListResponse } from '@/lib/quotes/types';
import { QuoteCategoryModel, type QuoteCategoryDoc } from '@/models/QuoteCategory';
import { QuoteModel, type QuoteDoc } from '@/models/Quote';

export type PublicQuoteCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type PublicQuoteListParams = {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  featured?: boolean;
};

function docToListItem(doc: QuoteDoc): QuoteListItem {
  return {
    id: doc._id.toString(),
    quoteText: doc.quoteText,
    attribution: doc.attribution ?? '',
    source: doc.source ?? '',
    sourceUrl: doc.sourceUrl ?? '',
    categoryId: doc.categoryId.toString(),
    categoryName: doc.categoryName,
    isFeatured: doc.isFeatured ?? false,
  };
}

export async function listActiveQuoteCategories(): Promise<PublicQuoteCategory[]> {
  await connectMongoose();
  const docs = await QuoteCategoryModel.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean<QuoteCategoryDoc[]>();
  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? '',
  }));
}

export async function listActiveQuotes(params: PublicQuoteListParams = {}): Promise<QuoteListResponse> {
  await connectMongoose();

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isActive: true };
  if (params.categoryId && mongoose.isValidObjectId(params.categoryId)) {
    filter.categoryId = params.categoryId;
  }
  if (params.featured === true) filter.isFeatured = true;

  const q = params.q?.trim();
  if (q) {
    filter.$or = [
      { quoteText: { $regex: q, $options: 'i' } },
      { attribution: { $regex: q, $options: 'i' } },
    ];
  }

  const [docs, total] = await Promise.all([
    QuoteModel.find(filter)
      .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<QuoteDoc[]>(),
    QuoteModel.countDocuments(filter),
  ]);

  return {
    quotes: docs.map((doc) => docToListItem(doc as QuoteDoc)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getActiveQuoteById(id: string): Promise<QuoteListItem | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectMongoose();
  const doc = await QuoteModel.findOne({ _id: id, isActive: true }).lean<QuoteDoc | null>();
  if (!doc) return null;
  return docToListItem(doc as QuoteDoc);
}

export async function getActiveQuotesByIds(ids: string[]): Promise<Map<string, QuoteListItem>> {
  const validIds = ids.filter((id) => mongoose.isValidObjectId(id));
  const map = new Map<string, QuoteListItem>();
  if (validIds.length === 0) return map;

  await connectMongoose();
  const docs = await QuoteModel.find({
    _id: { $in: validIds },
    isActive: true,
  }).lean<QuoteDoc[]>();

  for (const doc of docs) {
    map.set(doc._id.toString(), docToListItem(doc as QuoteDoc));
  }
  return map;
}
