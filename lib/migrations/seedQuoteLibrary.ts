import { connectMongoose } from '@/lib/mongoose';
import { QuoteCategoryModel } from '@/models/QuoteCategory';
import { QuoteModel } from '@/models/Quote';
import { slugifyQuoteCategoryName } from '@/lib/quotes/types';

const SEED_CATEGORIES = [
  { name: 'Marketing', description: 'Marketing wisdom and insights', sortOrder: 0 },
  { name: 'Sales', description: 'Sales motivation and strategy', sortOrder: 1 },
  { name: 'Leadership', description: 'Leadership and management', sortOrder: 2 },
  { name: 'Business', description: 'General business quotes', sortOrder: 3 },
  { name: 'Startups', description: 'Startup and entrepreneurship', sortOrder: 4 },
  { name: 'Customer Success', description: 'Customer success and service', sortOrder: 5 },
] as const;

const SEED_QUOTES: Array<{
  quoteText: string;
  attribution: string;
  source: string;
  categoryName: string;
  isFeatured?: boolean;
  sortOrder: number;
}> = [
  {
    quoteText: "The best marketing doesn't feel like marketing.",
    attribution: 'Tom Fishburne',
    source: 'Marketing',
    categoryName: 'Marketing',
    isFeatured: true,
    sortOrder: 0,
  },
  {
    quoteText: 'People do not buy what you do. They buy why you do it.',
    attribution: 'Simon Sinek',
    source: 'Start With Why',
    categoryName: 'Marketing',
    isFeatured: true,
    sortOrder: 1,
  },
  {
    quoteText: 'Make every interaction count.',
    attribution: 'Unknown',
    source: 'Customer Success',
    categoryName: 'Customer Success',
    sortOrder: 0,
  },
  {
    quoteText: 'Trust is built in drops and lost in buckets.',
    attribution: 'Kevin Plank',
    source: 'Leadership',
    categoryName: 'Leadership',
    sortOrder: 0,
  },
  {
    quoteText: 'The fortune is in the follow-up.',
    attribution: 'Unknown',
    source: 'Sales',
    categoryName: 'Sales',
    sortOrder: 0,
  },
  {
    quoteText: 'People do not buy products. They buy better versions of themselves.',
    attribution: 'Seth Godin',
    source: 'Marketing',
    categoryName: 'Marketing',
    sortOrder: 2,
  },
];

export type SeedQuoteLibraryResult = {
  seeded: boolean;
  categoriesCreated: number;
  quotesCreated: number;
};

export async function seedQuoteLibrary(): Promise<SeedQuoteLibraryResult> {
  await connectMongoose();

  const existing = await QuoteCategoryModel.countDocuments();
  if (existing > 0) {
    return { seeded: false, categoriesCreated: 0, quotesCreated: 0 };
  }

  const categoryIdByName = new Map<string, string>();

  for (const cat of SEED_CATEGORIES) {
    const slug = slugifyQuoteCategoryName(cat.name);
    const doc = await QuoteCategoryModel.create({
      name: cat.name,
      slug,
      description: cat.description,
      isActive: true,
      sortOrder: cat.sortOrder,
    });
    categoryIdByName.set(cat.name, doc._id.toString());
  }

  let quotesCreated = 0;
  for (const q of SEED_QUOTES) {
    const categoryId = categoryIdByName.get(q.categoryName);
    if (!categoryId) continue;
    await QuoteModel.create({
      quoteText: q.quoteText,
      attribution: q.attribution,
      source: q.source,
      sourceUrl: '',
      categoryId,
      categoryName: q.categoryName,
      isActive: true,
      isFeatured: q.isFeatured ?? false,
      sortOrder: q.sortOrder,
    });
    quotesCreated += 1;
  }

  return {
    seeded: true,
    categoriesCreated: SEED_CATEGORIES.length,
    quotesCreated,
  };
}
