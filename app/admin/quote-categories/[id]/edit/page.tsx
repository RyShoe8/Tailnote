import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminQuoteCategoryForm } from '@/components/admin/AdminQuoteCategoryForm';
import { getQuoteCategoryById } from '@/lib/admin/quoteCategories';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';

export const metadata = NOINDEX_METADATA;
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditQuoteCategoryPage({ params }: Props) {
  const { id } = await params;
  const category = await getQuoteCategoryById(id);
  if (!category) notFound();

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
          Edit
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Edit quote category</h1>
      </div>
      <AdminQuoteCategoryForm mode="edit" categoryId={id} initial={category} />
    </div>
  );
}
