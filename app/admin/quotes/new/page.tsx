import { AdminQuoteForm } from '@/components/admin/AdminQuoteForm';
import { listQuoteCategoriesAdmin } from '@/lib/admin/quoteCategories';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';

export const metadata = NOINDEX_METADATA;
export const dynamic = 'force-dynamic';

export default async function AdminNewQuotePage() {
  const categories = await listQuoteCategoriesAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New quote</h1>
      </div>
      <AdminQuoteForm mode="create" categories={categories} />
    </div>
  );
}
