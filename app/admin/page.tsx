import Link from 'next/link';
import { AdminCreateOrganizationForm } from '@/components/admin/AdminCreateOrganizationForm';
import { AdminDropLegacySlugIndexButton } from '@/components/admin/AdminDropLegacySlugIndexButton';
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
            Create organizations or open one to manage users, roles, and plans.
          </p>
        </div>
        <AdminCreateOrganizationForm assignablePlans={assignablePlans} />
      </div>
      <AdminDropLegacySlugIndexButton />
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="overflow-x-auto rounded-md border min-w-0">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Plan</th>
              <th className="p-3 font-medium">Subscription</th>
              <th className="p-3 font-medium">Users</th>
              <th className="p-3 font-medium">Created</th>
              <th className="p-3 font-medium w-24" />
            </tr>
          </thead>
          <tbody>
            {organizations.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-muted-foreground text-center">
                  No organizations yet.
                </td>
              </tr>
            ) : (
              organizations.map((o) => (
                <tr key={o._id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{o.name}</td>
                  <td className="p-3">{o.planDisplayName}</td>
                  <td className="p-3">{o.subscriptionStatus}</td>
                  <td className="p-3">{o.userCount}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/organizations/${o._id}`} className="text-primary underline underline-offset-4">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
