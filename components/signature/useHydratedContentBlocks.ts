'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ContentBlockData } from 'emailsignature-engine';
import type { QuoteListItem } from '@/lib/quotes/types';

async function fetchQuote(id: string): Promise<QuoteListItem | null> {
  const res = await fetch(`/api/quotes/${id}`, { credentials: 'include' });
  if (!res.ok) return null;
  const j = (await res.json()) as { quote?: QuoteListItem };
  return j.quote ?? null;
}

/** Client-side hydration for library quote blocks in live preview. */
export function useHydratedContentBlocks(blocks: ContentBlockData[]): ContentBlockData[] {
  const blocksKey = useMemo(() => JSON.stringify(blocks), [blocks]);
  const [hydrated, setHydrated] = useState<ContentBlockData[]>(blocks);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const next = await Promise.all(
        blocks.map(async (block) => {
          if (block.type !== 'quote' || !block.enabled) return block;

          const source = block.quoteSource ?? (block.quoteId ? 'library' : 'custom');
          if (source === 'custom') {
            return {
              ...block,
              quoteResolvedText: (block.quoteText ?? block.quoteResolvedText ?? '').trim(),
              quoteResolvedAttribution: (
                block.quoteAttribution ??
                block.quoteResolvedAttribution ??
                ''
              ).trim(),
            };
          }

          if (block.quoteResolvedText?.trim()) return block;
          if (!block.quoteId) return block;

          const quote = await fetchQuote(block.quoteId);
          if (!quote) return block;

          return {
            ...block,
            quoteResolvedText: quote.quoteText,
            quoteResolvedAttribution: quote.attribution || quote.source,
            quoteResolvedSourceUrl: quote.sourceUrl || undefined,
          };
        })
      );

      if (!cancelled) setHydrated(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [blocksKey, blocks]);

  return hydrated;
}
