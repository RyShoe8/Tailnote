import type { ContentBlockData } from 'emailsignature-engine';
import { getActiveQuotesByIds } from '@/lib/quotes/loadQuotes';

function effectiveQuoteText(block: ContentBlockData): string {
  if (block.type !== 'quote') return '';
  const source = block.quoteSource ?? (block.quoteId ? 'library' : 'custom');
  if (source === 'custom') {
    return (block.quoteText ?? '').trim();
  }
  return (block.quoteResolvedText ?? '').trim();
}

function effectiveQuoteAttribution(block: ContentBlockData): string {
  if (block.type !== 'quote') return '';
  const source = block.quoteSource ?? (block.quoteId ? 'library' : 'custom');
  if (source === 'custom') {
    return (block.quoteAttribution ?? '').trim();
  }
  return (block.quoteResolvedAttribution ?? '').trim();
}

/** Resolve library quoteIds to render-only fields. Custom quotes pass through unchanged. */
export async function hydrateQuoteContentBlocks(
  blocks: ContentBlockData[] | undefined
): Promise<ContentBlockData[]> {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];

  const quoteIds = blocks
    .filter((b) => b.type === 'quote' && b.enabled && b.quoteSource !== 'custom' && b.quoteId)
    .map((b) => b.quoteId as string);

  const quoteMap = quoteIds.length > 0 ? await getActiveQuotesByIds(quoteIds) : new Map();

  return blocks.map((block) => {
    if (block.type !== 'quote' || !block.enabled) return block;

    const source = block.quoteSource ?? (block.quoteId ? 'library' : 'custom');

    if (source === 'custom') {
      return {
        ...block,
        quoteResolvedText: (block.quoteText ?? '').trim(),
        quoteResolvedAttribution: (block.quoteAttribution ?? '').trim(),
        quoteResolvedSourceUrl: undefined,
      };
    }

    const quote = block.quoteId ? quoteMap.get(block.quoteId) : undefined;
    if (!quote) {
      return {
        ...block,
        quoteResolvedText: '',
        quoteResolvedAttribution: '',
        quoteResolvedSourceUrl: undefined,
      };
    }

    const attribution = quote.attribution.trim();
    const sourceLabel = quote.source.trim();
    const combinedAttribution = attribution || sourceLabel;

    return {
      ...block,
      quoteResolvedText: quote.quoteText.trim(),
      quoteResolvedAttribution: combinedAttribution,
      quoteResolvedSourceUrl: quote.sourceUrl.trim() || undefined,
    };
  });
}

export function getQuotePreviewLabel(block: ContentBlockData): string {
  const text = effectiveQuoteText(block);
  if (!text) return 'Quote';
  return text.length > 48 ? `${text.slice(0, 47)}…` : text;
}

export { effectiveQuoteText, effectiveQuoteAttribution };
