import Link from 'next/link';
import { AdminQuoteCategoryForm } from '@/components/admin/AdminQuoteCategoryForm';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';

export const metadata = NOINDEX_METADATA;

export default function AdminNewQuoteCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/content" className="hover:underline">
            Content
          </Link>
          {' / '}
          <Link href="/admin/quote-categories" className="hover:underline">
            Quote categories
          </Link>
          {' / '}
          New
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">New quote category</h1>
      </div>
      <AdminQuoteCategoryForm mode="create" />
    </div>
  );
}
