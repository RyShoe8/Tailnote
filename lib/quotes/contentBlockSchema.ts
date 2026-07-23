import { z } from 'zod';
import type { ContentBlockData } from 'emailsignature-engine';

export const ContentBlockListItemSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  urlPrefix: z.enum(['https', 'www']).optional(),
});

const QuoteDisplayFields = {
  quoteSource: z.enum(['library', 'custom']).optional(),
  quoteId: z.string().optional(),
  quoteText: z.string().max(2000).optional(),
  quoteAttribution: z.string().max(200).optional(),
  quoteShowAttribution: z.boolean().optional(),
  quoteAlignment: z.enum(['left', 'center']).optional(),
  quoteFontSize: z.enum(['small', 'medium', 'large']).optional(),
  quoteStyle: z.enum(['standard', 'minimal', 'highlighted']).optional(),
  quoteResolvedText: z.string().optional(),
  quoteResolvedAttribution: z.string().optional(),
  quoteResolvedSourceUrl: z.string().optional(),
};

export const ContentBlockSchema = z
  .object({
    type: z.enum([
      'book_a_call',
      'latest_blogs',
      'dynamic_content',
      'custom',
      'list',
      'image',
      'quote',
    ]),
    enabled: z.boolean().optional(),
    callTitle: z.string().optional(),
    callUrl: z.string().optional(),
    callButtonText: z.string().optional(),
    rssUrl: z.string().optional(),
    rssItems: z
      .array(
        z.object({
          title: z.string(),
          url: z.string(),
          imageUrl: z.string().optional(),
          pubDate: z.string().optional(),
        })
      )
      .optional(),
    rssLastFetched: z.string().optional(),
    rssRefreshInterval: z.enum(['none', 'daily', 'weekly']).optional(),
    contentSourceId: z.string().optional(),
    websiteUrl: z.string().optional(),
    feedUrl: z.string().optional(),
    detectionMode: z.enum(['auto', 'rss']).optional(),
    postsToDisplay: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    contentImageUrl: z.string().optional(),
    listTitle: z.string().optional(),
    listItems: z.array(ContentBlockListItemSchema).max(4).optional(),
    imageUrl: z.string().optional(),
    imageLinkUrl: z.string().optional(),
    customTitle: z.string().optional(),
    customText: z.string().optional(),
    customUrl: z.string().optional(),
    customImageUrl: z.string().optional(),
    ...QuoteDisplayFields,
  })
  .superRefine((block, ctx) => {
    if (block.type !== 'quote') return;

    const source = block.quoteSource ?? (block.quoteId ? 'library' : 'custom');
    if (source === 'library') {
      if (!block.quoteId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Library quote requires quoteId',
          path: ['quoteId'],
        });
      }
    } else if (!block.quoteText?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom quote requires quoteText',
        path: ['quoteText'],
      });
    }
  });

export const ContentBlocksArraySchema = z.array(ContentBlockSchema).max(2);

/** Strip render-only and library-duplicated fields before persisting. */
export function sanitizeContentBlocksForSave(blocks: ContentBlockData[]): ContentBlockData[] {
  return blocks.slice(0, 2).map((block) => {
    const next = { ...block } as ContentBlockData & Record<string, unknown>;
    delete next.quoteResolvedText;
    delete next.quoteResolvedAttribution;
    delete next.quoteResolvedSourceUrl;

    if (block.type === 'quote') {
      const source = block.quoteSource ?? (block.quoteId ? 'library' : 'custom');
      next.quoteSource = source;
      if (source === 'library') {
        next.quoteText = undefined;
        next.quoteAttribution = undefined;
      } else {
        next.quoteId = undefined;
      }
    }

    return next as ContentBlockData;
  });
}
