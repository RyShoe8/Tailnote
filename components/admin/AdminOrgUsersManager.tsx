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

export function AdminOrgUsersManager({ organizationId, onUserCountChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rows, setRows] = useState<RowState[]>([]);

  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addPassword, setAddPassword] = useState('');
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
        if (!cancelled) {
          setRows(
            users.map((u) => ({
              ...u,
              draftRole: u.role || 'member',
              draftPlatformAdmin: u.platformAdmin,
            }))
          );
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

  async function addUser(e: React.FormEvent) {
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
          password: addPassword,
          role: addRole,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(typeof j.error === 'string' ? j.error : 'Could not create user');
        return;
      }
      const user = j.user as AdminUserRow | undefined;
      if (user?.id) {
        setRows((prev) => [
          ...prev,
          {
            ...user,
            draftRole: user.role || 'member',
            draftPlatformAdmin: user.platformAdmin,
          },
        ]);
        onUserCountChange?.(1);
      }
      setAddEmail('');
      setAddName('');
      setAddPassword('');
      setAddRole(hasOwner ? 'member' : 'owner');
      setAddSuccess('User created.');
    } catch {
      setAddError('Could not create user');
    } finally {
      setAddSaving(false);
    }
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
          Org role and platform admin. Delete removes the auth account.
        </p>
      </div>

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

      <form onSubmit={(e) => void addUser(e)} className="space-y-3 max-w-lg border-t pt-4">
        <p className="text-sm font-medium">Add user</p>
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
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`add-password-${organizationId}`}>Password</Label>
            <Input
              id={`add-password-${organizationId}`}
              type="password"
              value={addPassword}
              onChange={(e) => setAddPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
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
        </div>
        {addError ? (
          <p className="text-sm text-destructive" role="alert">
            {addError}
          </p>
        ) : null}
        {addSuccess ? <p className="text-sm text-muted-foreground">{addSuccess}</p> : null}
        <Button type="submit" size="sm" disabled={addSaving}>
          {addSaving ? 'Creating…' : 'Add user'}
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
