import { AdminCreateOrganizationForm } from '@/components/admin/AdminCreateOrganizationForm';
import { AdminOrganizationsTable } from '@/components/admin/AdminOrganizationsTable';
import { listAssignableSubscriptionPlans, listOrganizationsWithUserCounts } from '@/lib/admin/data';

export const dynamic = 'force-dynamic';

export default async function AdminOrganizationsPage() {
  const [organizations, assignablePlans] = await Promise.all([
    listOrganizationsWithUserCounts(),
    listAssignableSubscriptionPlans(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Organizations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Expand an organization to manage users. Edit subscription plans inline.
          </p>
        </div>
        <AdminCreateOrganizationForm assignablePlans={assignablePlans} />
      </div>
      <AdminOrganizationsTable organizations={organizations} assignablePlans={assignablePlans} />
    </div>
  );
}
