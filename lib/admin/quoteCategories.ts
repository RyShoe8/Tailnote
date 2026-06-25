import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import {
  quoteCategoryCreateSchema,
  quoteCategoryUpdateSchema,
  slugifyQuoteCategoryName,
  type QuoteCategoryRow,
} from '@/lib/quotes/types';
import { QuoteCategoryModel, type QuoteCategoryDoc } from '@/models/QuoteCategory';
import { QuoteModel } from '@/models/Quote';

function docToRow(doc: QuoteCategoryDoc): QuoteCategoryRow {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? '',
    isActive: doc.isActive ?? true,
    sortOrder: doc.sortOrder ?? 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listQuoteCategoriesAdmin(): Promise<QuoteCategoryRow[]> {
  await connectMongoose();
  const docs = await QuoteCategoryModel.find({})
    .sort({ sortOrder: 1, name: 1 })
    .lean<QuoteCategoryDoc[]>();
  return docs.map((doc) => docToRow(doc as QuoteCategoryDoc));
}

export async function getQuoteCategoryById(id: string): Promise<QuoteCategoryRow | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectMongoose();
  const doc = await QuoteCategoryModel.findById(id).lean<QuoteCategoryDoc | null>();
  if (!doc) return null;
  return docToRow(doc as QuoteCategoryDoc);
}

export async function createQuoteCategory(input: unknown): Promise<QuoteCategoryRow> {
  const parsed = quoteCategoryCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join('; ') || 'Invalid category');
  }

  const data = parsed.data;
  await connectMongoose();

  const slug = (data.slug ?? slugifyQuoteCategoryName(data.name)).toLowerCase();
  const existing = await QuoteCategoryModel.findOne({ slug }).select('_id').lean();
  if (existing) {
    throw new Error('A category with this slug already exists');
  }

  const doc = await QuoteCategoryModel.create({
    name: data.name.trim(),
    slug,
    description: data.description?.trim() ?? '',
    isActive: data.isActive ?? true,
    sortOrder: data.sortOrder ?? 0,
  });

  return docToRow(doc);
}

export async function updateQuoteCategory(id: string, input: unknown): Promise<QuoteCategoryRow | null> {
  if (!mongoose.isValidObjectId(id)) return null;

  const parsed = quoteCategoryUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join('; ') || 'Invalid category');
  }

  await connectMongoose();
  const doc = await QuoteCategoryModel.findById(id);
  if (!doc) return null;

  const data = parsed.data;
  if (data.name !== undefined) doc.name = data.name.trim();
  if (data.slug !== undefined) doc.slug = data.slug.toLowerCase();
  else if (data.name !== undefined) doc.slug = slugifyQuoteCategoryName(data.name);
  if (data.description !== undefined) doc.description = data.description.trim();
  if (data.isActive !== undefined) doc.isActive = data.isActive;
  if (data.sortOrder !== undefined) doc.sortOrder = data.sortOrder;

  await doc.save();

  if (data.name !== undefined) {
    await QuoteModel.updateMany(
      { categoryId: doc._id },
      { $set: { categoryName: doc.name } }
    );
  }

  return docToRow(doc);
}

export async function deleteQuoteCategory(id: string): Promise<boolean> {
  if (!mongoose.isValidObjectId(id)) return false;
  await connectMongoose();

  const quoteCount = await QuoteModel.countDocuments({ categoryId: id });
  if (quoteCount > 0) {
    throw new Error('Cannot delete category with existing quotes. Reassign or delete quotes first.');
  }

  const result = await QuoteCategoryModel.findByIdAndDelete(id);
  return Boolean(result);
}
