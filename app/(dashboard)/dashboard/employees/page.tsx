import '@/lib/billing-engine';
import Link from 'next/link';
import { getEmployeeLimitsForOrganization, hasBrandingRemoval } from 'billing-engine';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { Button } from '@/components/ui/button';
import { EmployeesSeatSummaryCard } from '@/components/dashboard/EmployeesSeatSummaryCard';
import { EmployeesList, type EmployeeListItem } from '@/components/dashboard/EmployeesList';
import { DASHBOARD_UPGRADE_HREF } from '@/lib/billing/upgradeLinks';
import { getDashboardOrg, getDashboardSession } from '@/lib/dashboard/getDashboardContext';
import { getOrgOwnerUser } from '@/lib/org/getOrgOwnerUser';

export default async function EmployeesPage() {
  const { user } = await getDashboardSession();
  const org = await getDashboardOrg(user.organizationId);
  await connectMongoose();
  const [employees, limits, owner] = await Promise.all([
    EmployeeModel.find({ organizationId: user.organizationId })
      .sort({ createdAt: -1 })
      .lean(),
    getEmployeeLimitsForOrganization(user.organizationId),
    getOrgOwnerUser(user.organizationId),
  ]);

  const canManage = user.role === 'owner' || user.role === 'admin';
  const ownerUserId = owner?.id ?? '';

  const freePlan = !hasBrandingRemoval(org);

  const limitMessage =
    !limits.canAddMore && limits.maxEmployees !== null
      ? `Your plan includes ${limits.maxEmployees} user${limits.maxEmployees === 1 ? '' : 's'}. Upgrade to a paid plan to add more.`
      : null;

  const list: EmployeeListItem[] = employees.map((e) => {
    const userId = e.userId ? String(e.userId) : undefined;
    return {
      _id: String(e._id),
      firstName: String(e.firstName ?? ''),
      lastName: String(e.lastName ?? ''),
      email: String(e.email ?? ''),
      userId,
      inviteSentAt: e.inviteSentAt as Date | string | null | undefined,
      inviteAcceptedAt: e.inviteAcceptedAt as Date | string | null | undefined,
      inviteExpiresAt: e.inviteExpiresAt as Date | string | null | undefined,
      isOwnerEmployee: Boolean(userId && ownerUserId && userId === ownerUserId),
    };
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add team members by email and edit their signature details.</p>
        </div>
        {limits.canAddMore ? (
          <Button asChild className="shrink-0 self-start sm:self-auto">
            <Link href="/dashboard/employees/new">Add employee</Link>
          </Button>
        ) : (
          <Button disabled className="shrink-0 self-start sm:self-auto">
            Add employee
          </Button>
        )}
      </div>
      <EmployeesSeatSummaryCard organizationId={user.organizationId} />
      {limitMessage ? (
        <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
          {limitMessage}{' '}
          <Link href={DASHBOARD_UPGRADE_HREF} className="underline underline-offset-4">
            Upgrade now
          </Link>
          .
        </p>
      ) : null}
      {freePlan ? (
        <p className="text-xs text-muted-foreground">
          Free plans support one user. Upgrade to unlock team management and analytics.
        </p>
      ) : null}
      <div className="border rounded-lg divide-y overflow-hidden">
        <EmployeesList employees={list} canManage={canManage} />
      </div>
    </div>
  );
}
