'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { AdminAssignablePlan } from '@/lib/admin/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const NONE_PLAN_VALUE = '';
const SUBSCRIPTION_STATUSES = [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'none',
] as const;

type Props = {
  assignablePlans: AdminAssignablePlan[];
};

export function AdminCreateOrganizationForm({ assignablePlans }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [subscriptionPlanId, setSubscriptionPlanId] = useState(NONE_PLAN_VALUE);
  const [subscriptionStatus, setSubscriptionStatus] = useState<(typeof SUBSCRIPTION_STATUSES)[number]>('active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, string> = { name: name.trim() };
      if (subscriptionPlanId) {
        body.subscriptionPlanId = subscriptionPlanId;
        body.subscriptionStatus = subscriptionStatus;
      }

      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not create organization');
        return;
      }
      const orgId = typeof data.organizationId === 'string' ? data.organizationId : '';
      setOpen(false);
      setName('');
      setSubscriptionPlanId(NONE_PLAN_VALUE);
      setSubscriptionStatus('active');
      if (orgId) {
        router.push('/admin');
      }
      router.refresh();
    } catch {
      setError('Could not create organization');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button">Create organization</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create organization</SheetTitle>
          <SheetDescription>
            Provisions a new workspace with default templates. No Stripe checkout — assign a plan
            manually if needed.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-plan">Subscription plan (optional)</Label>
            <select
              id="org-plan"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={subscriptionPlanId}
              onChange={(e) => setSubscriptionPlanId(e.target.value)}
            >
              <option value={NONE_PLAN_VALUE}>None</option>
              {assignablePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {subscriptionPlanId ? (
            <div className="space-y-2">
              <Label htmlFor="org-status">Subscription status</Label>
              <select
                id="org-status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={subscriptionStatus}
                onChange={(e) =>
                  setSubscriptionStatus(e.target.value as (typeof SUBSCRIPTION_STATUSES)[number])
                }
              >
                {SUBSCRIPTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Creating…' : 'Create organization'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
