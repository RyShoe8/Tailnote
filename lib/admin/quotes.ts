import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import {
  quoteCreateSchema,
  quoteUpdateSchema,
  type QuoteListResponse,
  type QuoteRow,
} from '@/lib/quotes/types';
import { QuoteCategoryModel } from '@/models/QuoteCategory';
import { QuoteModel, type QuoteDoc } from '@/models/Quote';

function docToRow(doc: QuoteDoc): QuoteRow {
  return {
    id: doc._id.toString(),
    quoteText: doc.quoteText,
    attribution: doc.attribution ?? '',
    source: doc.source ?? '',
    sourceUrl: doc.sourceUrl ?? '',
    categoryId: doc.categoryId.toString(),
    categoryName: doc.categoryName,
    isActive: doc.isActive ?? true,
    isFeatured: doc.isFeatured ?? false,
    sortOrder: doc.sortOrder ?? 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export type AdminQuoteListParams = {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
};

export async function listQuotesAdmin(params: AdminQuoteListParams = {}): Promise<QuoteListResponse & { quotes: QuoteRow[] }> {
  await connectMongoose();

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (params.categoryId && mongoose.isValidObjectId(params.categoryId)) {
    filter.categoryId = params.categoryId;
  }
  if (params.isActive !== undefined) filter.isActive = params.isActive;
  if (params.isFeatured !== undefined) filter.isFeatured = params.isFeatured;

  const q = params.q?.trim();
  if (q) {
    filter.$or = [
      { quoteText: { $regex: q, $options: 'i' } },
      { attribution: { $regex: q, $options: 'i' } },
      { source: { $regex: q, $options: 'i' } },
    ];
  }

  const [docs, total] = await Promise.all([
    QuoteModel.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean<QuoteDoc[]>(),
    QuoteModel.countDocuments(filter),
  ]);

  return {
    quotes: docs.map((doc) => docToRow(doc as QuoteDoc)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getQuoteById(id: string): Promise<QuoteRow | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectMongoose();
  const doc = await QuoteModel.findById(id).lean<QuoteDoc | null>();
  if (!doc) return null;
  return docToRow(doc as QuoteDoc);
}

export async function createQuote(input: unknown): Promise<QuoteRow> {
  const parsed = quoteCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join('; ') || 'Invalid quote');
  }

  const data = parsed.data;
  if (!mongoose.isValidObjectId(data.categoryId)) {
    throw new Error('Invalid category');
  }

  await connectMongoose();
  const category = await QuoteCategoryModel.findById(data.categoryId).lean<{ name: string } | null>();
  if (!category) {
    throw new Error('Category not found');
  }

  const doc = await QuoteModel.create({
    quoteText: data.quoteText.trim(),
    attribution: data.attribution?.trim() ?? '',
    source: data.source?.trim() ?? '',
    sourceUrl: data.sourceUrl?.trim() ?? '',
    categoryId: data.categoryId,
    categoryName: category.name,
    isActive: data.isActive ?? true,
    isFeatured: data.isFeatured ?? false,
    sortOrder: data.sortOrder ?? 0,
  });

  return docToRow(doc);
}

export async function updateQuote(id: string, input: unknown): Promise<QuoteRow | null> {
  if (!mongoose.isValidObjectId(id)) return null;

  const parsed = quoteUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join('; ') || 'Invalid quote');
  }

  await connectMongoose();
  const doc = await QuoteModel.findById(id);
  if (!doc) return null;

  const data = parsed.data;
  if (data.quoteText !== undefined) doc.quoteText = data.quoteText.trim();
  if (data.attribution !== undefined) doc.attribution = data.attribution.trim();
  if (data.source !== undefined) doc.source = data.source.trim();
  if (data.sourceUrl !== undefined) doc.sourceUrl = data.sourceUrl.trim();
  if (data.isActive !== undefined) doc.isActive = data.isActive;
  if (data.isFeatured !== undefined) doc.isFeatured = data.isFeatured;
  if (data.sortOrder !== undefined) doc.sortOrder = data.sortOrder;

  if (data.categoryId !== undefined) {
    if (!mongoose.isValidObjectId(data.categoryId)) {
      throw new Error('Invalid category');
    }
    const category = await QuoteCategoryModel.findById(data.categoryId).lean<{ name: string } | null>();
    if (!category) {
      throw new Error('Category not found');
    }
    doc.categoryId = new mongoose.Types.ObjectId(data.categoryId);
    doc.categoryName = category.name;
  }

  await doc.save();
  return docToRow(doc);
}

export async function deleteQuote(id: string): Promise<boolean> {
  if (!mongoose.isValidObjectId(id)) return false;
  await connectMongoose();
  const result = await QuoteModel.findByIdAndDelete(id);
  return Boolean(result);
}
