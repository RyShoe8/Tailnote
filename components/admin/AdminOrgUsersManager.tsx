'use client';

import { useEffect, useState } from 'react';
import type { AdminUserRow } from '@/lib/admin/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  organizationId: string;
  onUserCountChange?: (delta: number) => void;
};

type RowState = AdminUserRow & { draftRole: string; draftPlatformAdmin: boolean };

type PendingInviteRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  inviteSentAt: string | null;
};

export function AdminOrgUsersManager({ organizationId, onUserCountChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rows, setRows] = useState<RowState[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInviteRow[]>([]);

  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addRole, setAddRole] = useState<'owner' | 'admin' | 'member'>('member');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const hasOwner = rows.some((r) => (r.role || r.draftRole) === 'owner');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const res = await fetch(`/api/admin/organizations/${organizationId}/users`, {
          credentials: 'include',
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setLoadError(typeof j.error === 'string' ? j.error : 'Could not load users');
          }
          return;
        }
        const users = (j.users as AdminUserRow[] | undefined) ?? [];
        const pending = (j.pendingInvites as PendingInviteRow[] | undefined) ?? [];
        if (!cancelled) {
          setRows(
            users.map((u) => ({
              ...u,
              draftRole: u.role || 'member',
              draftPlatformAdmin: u.platformAdmin,
            }))
          );
          setPendingInvites(pending);
          setAddRole(users.some((u) => u.role === 'owner') ? 'member' : 'owner');
        }
      } catch {
        if (!cancelled) setLoadError('Could not load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  async function saveUser(userId: string, role: string, platformAdmin: boolean) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, platformAdmin }),
      credentials: 'include',
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      return typeof j.error === 'string' ? j.error : 'Save failed';
    }
    return null;
  }

  async function deleteUser(userId: string) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      return typeof j.error === 'string' ? j.error : 'Delete failed';
    }
    return null;
  }

  async function reloadUsers() {
    const res = await fetch(`/api/admin/organizations/${organizationId}/users`, {
      credentials: 'include',
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const users = (j.users as AdminUserRow[] | undefined) ?? [];
    setRows(
      users.map((u) => ({
        ...u,
        draftRole: u.role || 'member',
        draftPlatformAdmin: u.platformAdmin,
      }))
    );
    setPendingInvites((j.pendingInvites as PendingInviteRow[] | undefined) ?? []);
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    setAddError(null);
    setAddSuccess(null);
    try {
      const res = await fetch(`/api/admin/organizations/${organizationId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: addEmail.trim(),
          name: addName.trim(),
          role: addRole,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(typeof j.error === 'string' ? j.error : 'Could not send invitation');
        return;
      }
      setAddEmail('');
      setAddName('');
      setAddRole(hasOwner ? 'member' : 'owner');
      setAddSuccess(
        typeof j.message === 'string' ? j.message : 'Invitation email sent. They can create an account from the link.'
      );
      await reloadUsers();
    } catch {
      setAddError('Could not send invitation');
    } finally {
      setAddSaving(false);
    }
  }

  async function resendInvite(invite: PendingInviteRow) {
    setAddError(null);
    setAddSuccess(null);
    const res = await fetch(`/api/admin/organizations/${organizationId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: invite.email,
        name: invite.name,
        role: invite.role,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAddError(typeof j.error === 'string' ? j.error : 'Could not resend invitation');
      return;
    }
    setAddSuccess(`Invitation resent to ${invite.email}.`);
    await reloadUsers();
  }

  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">Loading users…</p>;
  }

  if (loadError) {
    return <p className="p-4 text-sm text-destructive">{loadError}</p>;
  }

  return (
    <div className="space-y-6 p-4 bg-muted/20">
      <div>
        <h3 className="text-sm font-medium">Users</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Send an invite email so users create their own account. Invite links are secret URLs.
        </p>
      </div>

      {pendingInvites.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Pending invitations</p>
          {pendingInvites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed bg-background px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{invite.email}</p>
                <p className="text-xs text-muted-foreground">
                  {invite.name} · {invite.role}
                  {invite.inviteSentAt
                    ? ` · sent ${new Date(invite.inviteSentAt).toLocaleDateString()}`
                    : ''}
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => void resendInvite(invite)}>
                Resend
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users linked to this organization.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <UserRow
              key={row.id}
              row={row}
              onPatch={saveUser}
              onDelete={deleteUser}
              onRowUpdate={(next) => {
                setRows((prev) => prev.map((r) => (r.id === row.id ? next : r)));
              }}
              onDeleted={() => {
                setRows((prev) => prev.filter((r) => r.id !== row.id));
                onUserCountChange?.(-1);
              }}
            />
          ))}
        </div>
      )}

      <form onSubmit={(e) => void sendInvite(e)} className="space-y-3 max-w-lg border-t pt-4">
        <p className="text-sm font-medium">Invite user</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`add-email-${organizationId}`}>Email</Label>
            <Input
              id={`add-email-${organizationId}`}
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`add-name-${organizationId}`}>Name</Label>
            <Input
              id={`add-name-${organizationId}`}
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              required
              maxLength={120}
              autoComplete="off"
            />
          </div>
        </div>
        <div className="space-y-1.5 max-w-xs">
          <Label htmlFor={`add-role-${organizationId}`}>Org role</Label>
          <select
            id={`add-role-${organizationId}`}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={addRole}
            onChange={(e) => setAddRole(e.target.value as 'owner' | 'admin' | 'member')}
          >
            <option value="owner" disabled={hasOwner}>
              owner{hasOwner ? ' (already assigned)' : ''}
            </option>
            <option value="admin">admin</option>
            <option value="member">member</option>
          </select>
        </div>
        {addError ? (
          <p className="text-sm text-destructive" role="alert">
            {addError}
          </p>
        ) : null}
        {addSuccess ? <p className="text-sm text-muted-foreground">{addSuccess}</p> : null}
        <Button type="submit" size="sm" disabled={addSaving}>
          {addSaving ? 'Sending…' : 'Send invite'}
        </Button>
      </form>
    </div>
  );
}

function UserRow({
  row,
  onPatch,
  onDelete,
  onRowUpdate,
  onDeleted,
}: {
  row: RowState;
  onPatch: (userId: string, role: string, platformAdmin: boolean) => Promise<string | null>;
  onDelete: (userId: string) => Promise<string | null>;
  onRowUpdate: (row: RowState) => void;
  onDeleted: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const dirty =
    row.draftRole !== (row.role || 'member') || row.draftPlatformAdmin !== row.platformAdmin;

  async function save() {
    setSaving(true);
    setMsg(null);
    const err = await onPatch(row.id, row.draftRole, row.draftPlatformAdmin);
    if (err) {
      setMsg(err);
    } else {
      onRowUpdate({
        ...row,
        role: row.draftRole,
        platformAdmin: row.draftPlatformAdmin,
      });
      setMsg('Saved');
    }
    setSaving(false);
  }

  async function remove() {
    if (
      !window.confirm(`Delete ${row.email}? This removes their account and cannot be undone.`)
    ) {
      return;
    }
    setDeleting(true);
    setMsg(null);
    const err = await onDelete(row.id);
    if (err) {
      setMsg(err);
      setDeleting(false);
      return;
    }
    onDeleted();
  }

  return (
    <div className="rounded-md border bg-background p-3 space-y-3">
      <div>
        <p className="font-medium text-sm">{row.email}</p>
        {row.name ? <p className="text-xs text-muted-foreground">{row.name}</p> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
        <div className="space-y-1.5">
          <Label htmlFor={`role-${row.id}`}>Org role</Label>
          <select
            id={`role-${row.id}`}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            value={row.draftRole}
            onChange={(e) => onRowUpdate({ ...row, draftRole: e.target.value })}
          >
            <option value="owner">owner</option>
            <option value="admin">admin</option>
            <option value="member">member</option>
          </select>
        </div>
        <div className="flex items-end gap-2 pb-1">
          <input
            id={`pa-${row.id}`}
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={row.draftPlatformAdmin}
            onChange={(e) => onRowUpdate({ ...row, draftPlatformAdmin: e.target.checked })}
          />
          <Label htmlFor={`pa-${row.id}`} className="font-normal cursor-pointer text-sm">
            Platform admin
          </Label>
        </div>
      </div>
      {msg ? <p className="text-xs text-muted-foreground">{msg}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={!dirty || saving || deleting} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-destructive border-destructive/40 hover:bg-destructive/10"
          disabled={saving || deleting}
          onClick={() => void remove()}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </div>
  );
}
