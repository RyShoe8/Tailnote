import Link from 'next/link';
import { AdminQuoteCategoriesTable } from '@/components/admin/AdminQuoteCategoriesTable';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';
import { listQuoteCategoriesAdmin } from '@/lib/admin/quoteCategories';

export const metadata = NOINDEX_METADATA;
export const dynamic = 'force-dynamic';

export default async function AdminQuoteCategoriesPage() {
  const categories = await listQuoteCategoriesAdmin();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/content" className="hover:underline">
            Content
          </Link>
          {' / '}
          Quote categories
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Quote categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Categories for the Tailnote quote library used in signature promo blocks.
        </p>
      </div>
      <AdminQuoteCategoriesTable initialCategories={categories} />
    </div>
  );
}
