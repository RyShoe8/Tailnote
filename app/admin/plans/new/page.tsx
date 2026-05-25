import Link from 'next/link';
import { AdminPlanForm } from 'billing-engine/next/components';

export const dynamic = 'force-dynamic';

export default function NewAdminPlanPage() {
  return (
    <div className="space-y-6">
      <Link href="/admin/plans" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
        ← Plans
      </Link>
      <AdminPlanForm mode="create" />
    </div>
  );
}
