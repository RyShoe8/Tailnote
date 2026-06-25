'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuoteCategoryRow, QuoteRow } from '@/lib/quotes/types';

type FormState = {
  quoteText: string;
  attribution: string;
  source: string;
  sourceUrl: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

function rowToForm(row: QuoteRow): FormState {
  return {
    quoteText: row.quoteText,
    attribution: row.attribution,
    source: row.source,
    sourceUrl: row.sourceUrl,
    categoryId: row.categoryId,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    sortOrder: row.sortOrder,
  };
}

const emptyForm = (categoryId: string): FormState => ({
  quoteText: '',
  attribution: '',
  source: '',
  sourceUrl: '',
  categoryId,
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
});

type Props = {
  mode: 'create' | 'edit';
  quoteId?: string;
  initial?: QuoteRow;
  categories: QuoteCategoryRow[];
};

export function AdminQuoteForm({ mode, quoteId, initial, categories }: Props) {
  const router = useRouter();
  const defaultCategoryId = categories[0]?.id ?? '';
  const [form, setForm] = useState<FormState>(() =>
    initial ? rowToForm(initial) : emptyForm(defaultCategoryId)
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!form.categoryId && defaultCategoryId) {
      setForm((prev) => ({ ...prev, categoryId: defaultCategoryId }));
    }
  }, [defaultCategoryId, form.categoryId]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const body = {
      quoteText: form.quoteText.trim(),
      attribution: form.attribution.trim(),
      source: form.source.trim(),
      sourceUrl: form.sourceUrl.trim(),
      categoryId: form.categoryId,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      sortOrder: form.sortOrder,
    };

    const url = mode === 'create' ? '/api/admin/quotes' : `/api/admin/quotes/${quoteId}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setLoading(false);

    if (!res.ok) {
      setError(typeof j.error === 'string' ? j.error : 'Save failed');
      return;
    }

    router.push('/admin/quotes');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'New quote' : 'Edit quote'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quoteText">Quote text</Label>
            <Textarea
              id="quoteText"
              value={form.quoteText}
              onChange={(e) => updateField('quoteText', e.target.value)}
              rows={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attribution">Attribution</Label>
            <Input
              id="attribution"
              value={form.attribution}
              onChange={(e) => updateField('attribution', e.target.value)}
              placeholder="Seth Godin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={form.source}
              onChange={(e) => updateField('source', e.target.value)}
              placeholder="Book, publication, or category label"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source URL (optional link)</Label>
            <Input
              id="sourceUrl"
              value={form.sourceUrl}
              onChange={(e) => updateField('sourceUrl', e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={form.categoryId}
              onChange={(e) => updateField('categoryId', e.target.value)}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input
                id="sortOrder"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => updateField('sortOrder', Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => updateField('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="isActive" className="font-normal">
                  Active
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isFeatured"
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => updateField('isFeatured', e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="isFeatured" className="font-normal">
                  Featured
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : mode === 'create' ? 'Create quote' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/quotes">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
