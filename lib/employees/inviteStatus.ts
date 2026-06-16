import { isInviteExpired } from '@/lib/employees/inviteToken';

export type EmployeeInviteStatus = 'active' | 'accepted' | 'pending' | 'expired' | 'not_sent';

export type EmployeeInviteFields = {
  userId?: string | null;
  inviteSentAt?: Date | string | null;
  inviteAcceptedAt?: Date | string | null;
  inviteExpiresAt?: Date | string | null;
};

function isPendingInviteExpired(employee: EmployeeInviteFields): boolean {
  if (!employee.inviteSentAt || employee.inviteAcceptedAt || employee.userId) return false;
  if (!employee.inviteExpiresAt) return true;
  return isInviteExpired(employee.inviteExpiresAt);
}

export function getEmployeeInviteStatus(employee: EmployeeInviteFields): EmployeeInviteStatus {
  if (employee.userId) return 'active';
  if (employee.inviteAcceptedAt) return 'accepted';
  if (employee.inviteSentAt) {
    return isPendingInviteExpired(employee) ? 'expired' : 'pending';
  }
  return 'not_sent';
}

export function inviteStatusLabel(status: EmployeeInviteStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'accepted':
      return 'Accepted';
    case 'pending':
      return 'Pending';
    case 'expired':
      return 'Expired';
    case 'not_sent':
      return 'Not sent';
  }
}
