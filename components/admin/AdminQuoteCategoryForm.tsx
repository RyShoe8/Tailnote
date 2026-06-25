'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { slugifyQuoteCategoryName, type QuoteCategoryRow } from '@/lib/quotes/types';

type FormState = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
};

function rowToForm(row: QuoteCategoryRow): FormState {
  return {
    name: row.name,
    slug: row.slug,
    description: row.description,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

const emptyForm = (): FormState => ({
  name: '',
  slug: '',
  description: '',
  isActive: true,
  sortOrder: 0,
});

type Props = {
  mode: 'create' | 'edit';
  categoryId?: string;
  initial?: QuoteCategoryRow;
};

export function AdminQuoteCategoryForm({ mode, categoryId, initial }: Props) {
  const router = useRouter();
  const slugTouched = useRef(false);
  const [form, setForm] = useState<FormState>(() => (initial ? rowToForm(initial) : emptyForm()));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !slugTouched.current) {
        next.slug = slugifyQuoteCategoryName(String(value));
      }
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const body = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugifyQuoteCategoryName(form.name),
      description: form.description.trim(),
      isActive: form.isActive,
      sortOrder: form.sortOrder,
    };

    const url =
      mode === 'create'
        ? '/api/admin/quote-categories'
        : `/api/admin/quote-categories/${categoryId}`;
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

    router.push('/admin/quote-categories');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'New quote category' : 'Edit quote category'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => {
                slugTouched.current = true;
                updateField('slug', e.target.value);
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
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
            <div className="flex items-center gap-2 pt-8">
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
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : mode === 'create' ? 'Create category' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/quote-categories">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
