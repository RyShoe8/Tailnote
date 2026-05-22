import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { isPlatformAdmin } from '@/lib/auth/platformAdmin';
import { AdminHeaderNav } from '@/components/admin/AdminHeaderNav';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';

export const metadata = NOINDEX_METADATA;

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect('/login');
  }
  if (!(await isPlatformAdmin(session.user.id))) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <h1 className="min-w-0 shrink-0 text-lg font-semibold tracking-tight">Platform admin</h1>
        <AdminHeaderNav />
      </header>
      <div className="mx-auto max-w-5xl min-w-0 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
