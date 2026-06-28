'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { QuoteCategoryRow, QuoteRow } from '@/lib/quotes/types';
import { AdminQuoteAnalyticsPanel } from '@/components/admin/AdminQuoteAnalyticsPanel';

type Props = {
  initialCategories: QuoteCategoryRow[];
  initialQuotes: QuoteRow[];
  initialTotal: number;
  initialPage: number;
  initialLimit: number;
};

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function AdminQuotesTable({
  initialCategories,
  initialQuotes,
  initialTotal,
  initialPage,
  initialLimit,
}: Props) {
  const router = useRouter();
  const [categories] = useState(initialCategories);
  const [quotes, setQuotes] = useState(initialQuotes);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<string>('all'); // all, active, pending
  const [msg, setMsg] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit) || 1;

  const reload = useCallback(async (nextPage = page) => {
    const params = new URLSearchParams({ page: String(nextPage), limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    if (categoryId) params.set('categoryId', categoryId);
    if (status === 'active') params.set('isActive', 'true');
    if (status === 'pending') params.set('isActive', 'false');

    const res = await fetch(`/api/admin/quotes?${params}`, { credentials: 'include' });
    const j = (await res.json()) as {
      quotes?: QuoteRow[];
      total?: number;
      page?: number;
    };
    if (res.ok && j.quotes) {
      setQuotes(j.quotes);
      setTotal(j.total ?? 0);
      setPage(j.page ?? nextPage);
    }
  }, [page, limit, q, categoryId, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload(1);
    }, 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced search
  }, [q, categoryId, status]);

  async function onDelete(quote: QuoteRow) {
    if (!confirm('Delete this quote? This cannot be undone.')) return;
    setMsg(null);
    const res = await fetch(`/api/admin/quotes/${quote.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg(typeof j.error === 'string' ? j.error : 'Delete failed');
      return;
    }
    await reload(page);
    router.refresh();
  }
  async function onAccept(quote: QuoteRow) {
    setMsg(null);
    const res = await fetch(`/api/admin/quotes/${quote.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg(typeof j.error === 'string' ? j.error : 'Accept failed');
      return;
    }
    await reload(page);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <AdminQuoteAnalyticsPanel />

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm text-muted-foreground">{total} quote(s)</p>
          <Button asChild>
            <Link href="/admin/quotes/new">New quote</Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="min-w-[200px] flex-1 space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search quotes…"
            />
          </div>
          <div className="min-w-[180px] space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
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
          <div className="min-w-[150px] space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {msg ? <p className="text-sm text-destructive">{msg}</p> : null}

        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Quote</th>
                <th className="px-3 py-2 font-medium">Attribution</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-slate-100">
                  <td className="max-w-xs px-3 py-3 font-medium text-foreground">
                    {truncate(quote.quoteText, 80)}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{quote.attribution || '—'}</td>
                  <td className="px-3 py-3 text-muted-foreground">{quote.categoryName}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={quote.isActive ? 'default' : 'outline'}>
                        {quote.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {quote.isFeatured ? <Badge variant="outline">Featured</Badge> : null}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {!quote.isActive && (
                        <Button variant="default" size="sm" onClick={() => void onAccept(quote)}>
                          Accept
                        </Button>
                      )}
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/quotes/${quote.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => void onDelete(quote)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                    No quotes found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => void reload(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => void reload(page + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
