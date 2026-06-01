import Link from 'next/link';
import { EmailHealthScansTable } from '@/components/admin/EmailHealthScansTable';
import { countEmailHealthScans, listEmailHealthScans } from '@/lib/admin/emailHealthScans';

export const dynamic = 'force-dynamic';

export default async function AdminEmailHealthPage() {
  const [scans, totalCount] = await Promise.all([listEmailHealthScans(), countEmailHealthScans()]);
  const showingCap = scans.length >= 500 && totalCount > scans.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Email health scans</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Domains run through the public checker at{' '}
          <Link href="/email-health" className="text-primary hover:underline">
            /email-health
          </Link>
          . {totalCount} total{showingCap ? ` (showing latest ${scans.length})` : ''}.
        </p>
      </div>
      <EmailHealthScansTable initialScans={scans} />
    </div>
  );
}
