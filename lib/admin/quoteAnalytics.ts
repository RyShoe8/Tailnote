import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { UserSignatureProfileModel } from '@/models/UserSignatureProfile';
import { SignatureClickEventModel } from '@/models/SignatureClickEvent';
import { QuoteModel } from '@/models/Quote';
import type { ContentBlockData } from 'emailsignature-engine';

export type TopQuoteAnalytics = {
  quoteId: string;
  quoteText: string;
  attribution: string;
  usageCount: number;
  clickCount: number;
};

export type QuoteAnalyticsSummary = {
  topQuotes: TopQuoteAnalytics[];
  totalLibraryUsage: number;
  totalCustomUsage: number;
};

function isQuoteBlock(b: unknown): b is ContentBlockData {
  return (
    typeof b === 'object' &&
    b !== null &&
    'type' in b &&
    (b as ContentBlockData).type === 'quote' &&
    (b as ContentBlockData).enabled === true
  );
}

function countQuoteBlocks(blocks: unknown[]): { library: Map<string, number>; custom: number } {
  const library = new Map<string, number>();
  let custom = 0;

  for (const b of blocks) {
    if (!isQuoteBlock(b)) continue;
    if (b.quoteSource === 'library' && b.quoteId) {
      library.set(b.quoteId, (library.get(b.quoteId) ?? 0) + 1);
    } else if (b.quoteSource === 'custom' || b.quoteText?.trim()) {
      custom += 1;
    }
  }

  return { library, custom };
}

export async function getQuoteAnalyticsSummary(): Promise<QuoteAnalyticsSummary> {
  await connectMongoose();

  const usageByQuoteId = new Map<string, number>();
  let totalCustomUsage = 0;

  const [employees, profiles] = await Promise.all([
    EmployeeModel.find({}).select('contentBlocks').lean(),
    UserSignatureProfileModel.find({}).select('contentBlocks').lean(),
  ]);

  for (const emp of employees) {
    const blocks = Array.isArray(emp.contentBlocks) ? emp.contentBlocks : [];
    const { library, custom } = countQuoteBlocks(blocks);
    for (const [id, count] of library) {
      usageByQuoteId.set(id, (usageByQuoteId.get(id) ?? 0) + count);
    }
    totalCustomUsage += custom;
  }

  for (const profile of profiles) {
    const blocks = Array.isArray(profile.contentBlocks) ? profile.contentBlocks : [];
    const { library, custom } = countQuoteBlocks(blocks);
    for (const [id, count] of library) {
      usageByQuoteId.set(id, (usageByQuoteId.get(id) ?? 0) + count);
    }
    totalCustomUsage += custom;
  }

  const clickAgg = await SignatureClickEventModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $match: { quoteId: { $exists: true, $ne: null } } },
    { $group: { _id: '$quoteId', count: { $sum: 1 } } },
  ]);

  const clicksByQuoteId = new Map<string, number>();
  for (const row of clickAgg) {
    if (row._id) clicksByQuoteId.set(row._id.toString(), row.count);
  }

  const quoteIds = [...usageByQuoteId.keys(), ...clicksByQuoteId.keys()];
  const uniqueIds = [...new Set(quoteIds)].filter((id) => mongoose.isValidObjectId(id));

  const quoteDocs = uniqueIds.length
    ? await QuoteModel.find({ _id: { $in: uniqueIds } })
        .select('quoteText attribution')
        .lean<{ _id: mongoose.Types.ObjectId; quoteText: string; attribution?: string }[]>()
    : [];

  const quoteMeta = new Map(
    quoteDocs.map((q) => [q._id.toString(), { quoteText: q.quoteText, attribution: q.attribution ?? '' }])
  );

  const ranked: TopQuoteAnalytics[] = uniqueIds.map((id) => {
    const meta = quoteMeta.get(id);
    return {
      quoteId: id,
      quoteText: meta?.quoteText ?? '(deleted quote)',
      attribution: meta?.attribution ?? '',
      usageCount: usageByQuoteId.get(id) ?? 0,
      clickCount: clicksByQuoteId.get(id) ?? 0,
    };
  });

  ranked.sort((a, b) => {
    const scoreA = a.usageCount * 10 + a.clickCount;
    const scoreB = b.usageCount * 10 + b.clickCount;
    return scoreB - scoreA;
  });

  const totalLibraryUsage = [...usageByQuoteId.values()].reduce((sum, n) => sum + n, 0);

  return {
    topQuotes: ranked.slice(0, 10),
    totalLibraryUsage,
    totalCustomUsage,
  };
}
