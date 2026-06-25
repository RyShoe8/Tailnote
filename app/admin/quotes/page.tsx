import { AdminQuotesTable } from '@/components/admin/AdminQuotesTable';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';
import { listQuoteCategoriesAdmin } from '@/lib/admin/quoteCategories';
import { listQuotesAdmin } from '@/lib/admin/quotes';

export const metadata = NOINDEX_METADATA;
export const dynamic = 'force-dynamic';

export default async function AdminQuotesPage() {
  const [categories, quotesResult] = await Promise.all([
    listQuoteCategoriesAdmin(),
    listQuotesAdmin({ page: 1, limit: 20 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated quotes for signature promotional blocks.
        </p>
      </div>
      <AdminQuotesTable
        initialCategories={categories}
        initialQuotes={quotesResult.quotes}
        initialTotal={quotesResult.total}
        initialPage={quotesResult.page}
        initialLimit={quotesResult.limit}
      />
    </div>
  );
}
