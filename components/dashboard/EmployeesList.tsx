'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EmployeeInviteBadge } from '@/components/dashboard/EmployeeInviteBadge';

export type EmployeeListItem = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userId?: string | null;
  inviteSentAt?: Date | string | null;
  inviteAcceptedAt?: Date | string | null;
  inviteExpiresAt?: Date | string | null;
  isOwnerEmployee?: boolean;
};

type Props = {
  employees: EmployeeListItem[];
  canManage: boolean;
};

export function EmployeesList({ employees, canManage }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  async function deleteEmployee(employeeId: string, label: string) {
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    setListError(null);
    setDeletingId(employeeId);
    try {
      const res = await fetch(`/api/dashboard/employees/${employeeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(typeof data.error === 'string' ? data.error : 'Could not delete employee');
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (employees.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No employees yet.</p>;
  }

  return (
    <div>
      {listError ? (
        <p className="border-b px-4 py-3 text-sm text-destructive">{listError}</p>
      ) : null}
      {employees.map((e) => {
        const label = [e.firstName, e.lastName].filter(Boolean).join(' ') || e.email;
        return (
          <div
            key={e._id}
            className="flex flex-col gap-3 border-b p-4 transition-colors last:border-b-0 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <Link href={`/dashboard/employees/${e._id}`} className="min-w-0 flex-1">
              <p className="truncate font-medium">{label}</p>
              <p className="truncate text-sm text-muted-foreground">{e.email}</p>
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
              <EmployeeInviteBadge
                employee={{
                  userId: e.userId,
                  inviteSentAt: e.inviteSentAt,
                  inviteAcceptedAt: e.inviteAcceptedAt,
                  inviteExpiresAt: e.inviteExpiresAt,
                }}
                isOwnerEmployee={e.isOwnerEmployee}
              />
              <div className="flex shrink-0 items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/dashboard/employees/${e._id}`}>Edit</Link>
                </Button>
                {canManage && !e.isOwnerEmployee ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deletingId === e._id}
                    onClick={() => void deleteEmployee(e._id, label)}
                  >
                    {deletingId === e._id ? 'Deleting…' : 'Delete'}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
