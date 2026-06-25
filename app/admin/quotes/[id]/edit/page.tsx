import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminQuoteForm } from '@/components/admin/AdminQuoteForm';
import { listQuoteCategoriesAdmin } from '@/lib/admin/quoteCategories';
import { getQuoteById } from '@/lib/admin/quotes';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';

export const metadata = NOINDEX_METADATA;
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditQuotePage({ params }: Props) {
  const { id } = await params;
  const [quote, categories] = await Promise.all([getQuoteById(id), listQuoteCategoriesAdmin()]);
  if (!quote) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/content" className="hover:underline">
            Content
          </Link>
          {' / '}
          <Link href="/admin/quotes" className="hover:underline">
            Quotes
          </Link>
          {' / '}
          Edit
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Edit quote</h1>
      </div>
      <AdminQuoteForm mode="edit" quoteId={id} initial={quote} categories={categories} />
    </div>
  );
}
