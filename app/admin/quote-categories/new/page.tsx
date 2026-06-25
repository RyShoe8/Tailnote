import { AdminQuoteCategoryForm } from '@/components/admin/AdminQuoteCategoryForm';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';

export const metadata = NOINDEX_METADATA;

export default function AdminNewQuoteCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New quote category</h1>
      </div>
      <AdminQuoteCategoryForm mode="create" />
    </div>
  );
}
