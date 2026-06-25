'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { QuoteCategoryRow } from '@/lib/quotes/types';

type Props = {
  initialCategories: QuoteCategoryRow[];
};

export function AdminQuoteCategoriesTable({ initialCategories }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch('/api/admin/quote-categories', { credentials: 'include' });
    const j = (await res.json()) as { categories?: QuoteCategoryRow[] };
    if (res.ok && j.categories) setCategories(j.categories);
  }, []);

  async function onDelete(category: QuoteCategoryRow) {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    setMsg(null);
    const res = await fetch(`/api/admin/quote-categories/${category.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg(typeof j.error === 'string' ? j.error : 'Delete failed');
      return;
    }
    await reload();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{categories.length} categor(ies)</p>
        <Button asChild>
          <Link href="/admin/quote-categories/new">New category</Link>
        </Button>
      </div>

      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}

      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Slug</th>
              <th className="px-3 py-2 font-medium">Sort</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-slate-100">
                <td className="px-3 py-3 font-medium text-foreground">{cat.name}</td>
                <td className="px-3 py-3 text-muted-foreground">{cat.slug}</td>
                <td className="px-3 py-3 text-muted-foreground">{cat.sortOrder}</td>
                <td className="px-3 py-3">
                  <Badge variant={cat.isActive ? 'default' : 'outline'}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/quote-categories/${cat.id}/edit`}>Edit</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void onDelete(cat)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No categories yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
