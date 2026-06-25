'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ContentBlockData } from 'emailsignature-engine';
import type { QuoteListItem } from '@/lib/quotes/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  selectedQuoteId?: string;
  onSelect: (quote: QuoteListItem) => void;
};

type QuoteCategoryOption = { id: string; name: string };

export function QuoteLibraryPicker({ selectedQuoteId, onSelect }: Props) {
  const [categories, setCategories] = useState<QuoteCategoryOption[]>([]);
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuotes = useCallback(async (nextPage: number, q: string, catId: string) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(nextPage), limit: '10' });
    if (q.trim()) params.set('q', q.trim());
    if (catId) params.set('categoryId', catId);

    const res = await fetch(`/api/quotes?${params}`, { credentials: 'include' });
    const j = (await res.json()) as {
      quotes?: QuoteListItem[];
      totalPages?: number;
      error?: string;
    };
    setLoading(false);
    if (!res.ok) {
      setError(typeof j.error === 'string' ? j.error : 'Failed to load quotes');
      return;
    }
    setQuotes(j.quotes ?? []);
    setTotalPages(j.totalPages ?? 1);
    setPage(nextPage);
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/quotes/categories', { credentials: 'include' });
      const j = (await res.json()) as { categories?: QuoteCategoryOption[] };
      if (res.ok && j.categories) setCategories(j.categories);
    })();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQuotes(1, search, categoryId);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, categoryId, loadQuotes]);

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[160px] flex-1 space-y-2">
          <Label htmlFor="quote-search">Search</Label>
          <Input
            id="quote-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quotes…"
          />
        </div>
        <div className="min-w-[160px] space-y-2">
          <Label htmlFor="quote-category">Category</Label>
          <select
            id="quote-category"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading quotes…</p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {quotes.map((quote) => {
            const selected = selectedQuoteId === quote.id;
            return (
              <li key={quote.id}>
                <button
                  type="button"
                  onClick={() => onSelect(quote)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <p className="italic text-foreground">&ldquo;{quote.quoteText}&rdquo;</p>
                  {quote.attribution ? (
                    <p className="mt-1 text-xs text-muted-foreground">— {quote.attribution}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">{quote.categoryName}</p>
                </button>
              </li>
            );
          })}
          {quotes.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted-foreground">No quotes found.</li>
          ) : null}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => void loadQuotes(page - 1, search, categoryId)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => void loadQuotes(page + 1, search, categoryId)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
