import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { QuoteModel } from '@/models/Quote';
import { normalizeQuoteText } from '@/lib/quotes/normalizeQuoteText';

export type QuoteUsageResult = {
  used: boolean;
  source?: 'library' | 'submission';
};

type Options = {
  excludeUserId?: string;
};

export async function isQuoteAlreadyUsed(
  quote: string,
  options: Options = {},
): Promise<QuoteUsageResult> {
  const normalized = normalizeQuoteText(quote);
  if (!normalized) {
    return { used: false };
  }

  const libraryQuotes = await QuoteModel.find({}).select('quoteText').lean();
  for (const row of libraryQuotes) {
    if (normalizeQuoteText(row.quoteText) === normalized) {
      return { used: true, source: 'library' };
    }
  }

  const submissionFilter: Record<string, unknown> = {
    status: { $ne: 'rejected' },
  };
  if (options.excludeUserId) {
    submissionFilter.userId = { $ne: options.excludeUserId };
  }

  const submissions = await CampaignSubmissionModel.find(submissionFilter)
    .select('content')
    .lean();

  for (const submission of submissions) {
    const content = submission.content as { quote?: string } | undefined;
    const submissionQuote = content?.quote;
    if (submissionQuote && normalizeQuoteText(submissionQuote) === normalized) {
      return { used: true, source: 'submission' };
    }
  }

  return { used: false };
}
