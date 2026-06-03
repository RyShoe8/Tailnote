import Link from 'next/link';
import '@/lib/billing-engine';
import { getEmployeeLimitsForOrganization } from 'billing-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  organizationId: string;
};

export async function EmployeesSeatSummaryCard({ organizationId }: Props) {
  const seatLimits = await getEmployeeLimitsForOrganization(organizationId);

  const seatsAvailable =
    seatLimits.maxEmployees !== null
      ? Math.max(0, seatLimits.maxEmployees - seatLimits.currentCount)
      : null;

  const employeesDescription =
    seatLimits.maxEmployees !== null
      ? 'Seats used on your plan.'
      : seatLimits.includedUsers !== null && seatLimits.canAddBeyondIncluded
        ? 'Team members with a hosted preview and exportable HTML.'
        : 'People with a hosted preview and exportable HTML.';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employees</CardTitle>
        <CardDescription>{employeesDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {seatLimits.maxEmployees !== null ? (
          <p className="text-3xl font-semibold tabular-nums">
            {seatLimits.currentCount}
            <span className="text-xl font-normal text-muted-foreground">
              {' '}
              / {seatLimits.maxEmployees}
            </span>
          </p>
        ) : (
          <p className="text-3xl font-semibold tabular-nums">
            {seatLimits.currentCount}
            {seatLimits.includedUsers !== null && seatLimits.canAddBeyondIncluded ? (
              <span className="text-lg font-normal text-muted-foreground"> in use</span>
            ) : null}
          </p>
        )}
        {seatsAvailable !== null ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {seatsAvailable > 0
              ? `${seatsAvailable} seat${seatsAvailable === 1 ? '' : 's'} available`
              : 'All seats in use'}
          </p>
        ) : seatLimits.includedUsers !== null && seatLimits.canAddBeyondIncluded ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Includes {seatLimits.includedUsers} ·{' '}
            <Link href="/dashboard/billing" className="underline underline-offset-4">
              add more on Billing
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
