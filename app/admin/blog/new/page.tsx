import { AdminBlogPostForm } from '@/components/admin/AdminBlogPostForm';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';

export const metadata = NOINDEX_METADATA;
export const dynamic = 'force-dynamic';

export default function AdminBlogNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New blog post</h1>
      </div>
      <AdminBlogPostForm mode="create" />
    </div>
  );
}
