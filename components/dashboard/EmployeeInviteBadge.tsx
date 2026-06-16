import {
  getEmployeeInviteStatus,
  inviteStatusLabel,
  type EmployeeInviteFields,
} from '@/lib/employees/inviteStatus';

const styles: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  accepted: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-800 dark:text-amber-400',
  expired: 'bg-destructive/10 text-destructive',
  not_sent: 'bg-muted text-muted-foreground',
};

export function EmployeeInviteBadge({
  employee,
  isOwnerEmployee = false,
}: {
  employee: EmployeeInviteFields;
  isOwnerEmployee?: boolean;
}) {
  if (isOwnerEmployee) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        Account owner
      </span>
    );
  }

  const status = getEmployeeInviteStatus(employee);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {inviteStatusLabel(status)}
    </span>
  );
}
