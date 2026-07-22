'use client';

import { useState } from 'react';
import type { AdminAssignablePlan } from '@/lib/admin/data';
import {
  formatAdminPlanDisplayName,
  isIncompleteCheckoutDisplay,
} from '@/lib/admin/incompleteCheckoutDisplay';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NONE_PLAN_VALUE = '';

type Props = {
  organizationId: string;
  subscriptionPlanId: string;
  subscriptionStatus: string;
  /** From server list: incomplete pin with no Stripe subscription */
  checkoutIncomplete?: boolean;
  assignablePlans: AdminAssignablePlan[];
  onSaved?: (next: {
    subscriptionPlanId: string;
    planDisplayName: string;
    subscriptionStatus?: string;
    checkoutIncomplete?: boolean;
  }) => void;
};

export function AdminOrgPlanInlineEditor({
  organizationId,
  subscriptionPlanId: initialPlanId,
  subscriptionStatus,
  checkoutIncomplete = false,
  assignablePlans,
  onSaved,
}: Props) {
  const [subscriptionPlanId, setSubscriptionPlanId] = useState(initialPlanId || NONE_PLAN_VALUE);
  const [savedPlanId, setSavedPlanId] = useState(initialPlanId || NONE_PLAN_VALUE);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const dirty = subscriptionPlanId !== savedPlanId;
  const statusLabel = checkoutIncomplete
    ? 'incomplete · checkout incomplete'
    : subscriptionStatus || 'none';

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionPlanId: subscriptionPlanId || null,
        }),
        credentials: 'include',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof j.error === 'string' ? j.error : 'Save failed');
        return;
      }

      setSavedPlanId(subscriptionPlanId);
      const pinned = j.organizationSubscription?.subscriptionPlanId as
        | { name?: string; version?: number; interval?: string }
        | null
        | undefined;
      let baseLabel = 'None';
      if (pinned && typeof pinned === 'object' && pinned.name) {
        baseLabel = `${pinned.name} (v${pinned.version ?? 1}, ${pinned.interval ?? 'year'})`;
      } else if (subscriptionPlanId) {
        const match = assignablePlans.find((p) => p.id === subscriptionPlanId);
        if (match) baseLabel = `${match.name} (v${match.version}, ${match.interval})`;
      }

      const nextStatus =
        typeof j.organization?.subscriptionStatus === 'string'
          ? j.organization.subscriptionStatus
          : subscriptionPlanId
            ? 'active'
            : subscriptionStatus;
      const stripeSubscriptionId = String(j.organization?.stripeSubscriptionId ?? '');
      const planDisplayName = formatAdminPlanDisplayName(baseLabel, {
        subscriptionStatus: nextStatus,
        subscriptionPlanId,
        stripeSubscriptionId,
      });
      const nextIncomplete = isIncompleteCheckoutDisplay({
        subscriptionStatus: nextStatus,
        subscriptionPlanId,
        stripeSubscriptionId,
      });

      onSaved?.({
        subscriptionPlanId,
        planDisplayName,
        subscriptionStatus: nextStatus,
        checkoutIncomplete: nextIncomplete,
      });
      setMessage('Saved');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1.5 min-w-[10rem]">
      <p
        className={cn(
          'text-xs',
          checkoutIncomplete ? 'font-medium text-amber-800 dark:text-amber-400' : 'text-muted-foreground',
        )}
      >
        {statusLabel}
      </p>
      <select
        aria-label="Subscription plan"
        className="flex h-8 w-full max-w-[14rem] rounded-md border border-input bg-transparent px-2 text-xs"
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
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        disabled={!dirty || saving}
        onClick={() => void save()}
      >
        {saving ? 'Saving…' : 'Save'}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
