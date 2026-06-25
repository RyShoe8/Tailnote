import Link from 'next/link';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';

export const metadata = NOINDEX_METADATA;

export default function AdminContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage platform content used in signatures and marketing.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/quote-categories"
          className="rounded-lg border p-5 transition-colors hover:bg-muted/50"
        >
          <h2 className="font-medium text-foreground">Quote categories</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize the Tailnote quote library by topic.
          </p>
        </Link>
        <Link
          href="/admin/quotes"
          className="rounded-lg border p-5 transition-colors hover:bg-muted/50"
        >
          <h2 className="font-medium text-foreground">Quotes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Curate quotes users can add to email signatures.
          </p>
        </Link>
        <Link
          href="/admin/blog"
          className="rounded-lg border p-5 transition-colors hover:bg-muted/50"
        >
          <h2 className="font-medium text-foreground">Blog</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage blog posts for tailnote.io/blog.
          </p>
        </Link>
      </div>
    </div>
  );
}
