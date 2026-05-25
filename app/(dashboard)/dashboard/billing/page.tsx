'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { AccountSecurityCard } from '@/components/dashboard/AccountSecurityCard';
import { PricingPlanCard } from 'billing-engine/next/components';
import type { PublicPricingPlan } from 'billing-engine';
import type { EmployeeLimitInfo } from 'billing-engine';
import { formatUsd, intervalSuffix } from 'billing-engine/pricing-display';

type BillingSummary = {
  renewsAt?: string | null;
  cancelAtPeriodEnd?: boolean;
  subscriptionStatus?: string;
  canCancel?: boolean;
  canReactivate?: boolean;
  canChangePlan?: boolean;
  canAddSeats?: boolean;
  addSeatsHref?: string | null;
  addSeatsBlockedReason?: string | null;
};

type BillingPayload = {
  organization?: Record<string, unknown> | null;
  billing?: BillingSummary | null;
  currentPlan?: PublicPricingPlan | null;
  availablePlans?: PublicPricingPlan[];
  seatLimits?: EmployeeLimitInfo | null;
  viewer?: { role?: string };
};

function formatBillingDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function seatUsageLine(
  limits: EmployeeLimitInfo | null | undefined,
  plan: PublicPricingPlan | null | undefined
): string | null {
  if (!limits) return null;
  const count = limits.currentCount;
  if (limits.maxEmployees !== null) {
    return `${count} of ${limits.maxEmployees} seats in use`;
  }
  if (limits.canAddBeyondIncluded && plan && plan.additionalUserPriceCents > 0) {
    return `${count} seats in use · add more at ${formatUsd(plan.additionalUserPriceCents)} per user${intervalSuffix(plan.interval)}`;
  }
  if (limits.includedUsers !== null) {
    return `${count} of ${limits.includedUsers} included users`;
  }
  return `${count} seat${count === 1 ? '' : 's'} in use`;
}

function BillingPageInner() {
  const [org, setOrg] = useState<Record<string, unknown> | null>(null);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PublicPricingPlan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PublicPricingPlan[]>([]);
  const [seatLimits, setSeatLimits] = useState<EmployeeLimitInfo | null>(null);
  const [viewerRole, setViewerRole] = useState<string>('member');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelPending, setCancelPending] = useState(false);
  const [reactivatePending, setReactivatePending] = useState(false);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [changePlanPendingId, setChangePlanPendingId] = useState<string | null>(null);

  const loadBilling = useCallback(async () => {
    setLoadError(null);
    const res = await fetch('/api/dashboard/billing');
    const data = (await res.json().catch(() => ({}))) as BillingPayload & { error?: string };
    if (!res.ok) {
      throw new Error(typeof data.error === 'string' ? data.error : 'Could not load billing status');
    }
    setOrg(data.organization ?? null);
    setBilling(data.billing ?? null);
    setCurrentPlan(data.currentPlan ?? null);
    setAvailablePlans(data.availablePlans ?? []);
    setSeatLimits(data.seatLimits ?? null);
    setViewerRole(data.viewer?.role ?? 'member');
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadBilling().catch((e: unknown) => {
      if (!cancelled) {
        setOrg(null);
        setBilling(null);
        setCurrentPlan(null);
        setLoadError(e instanceof Error ? e.message : 'Could not load billing status');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadBilling]);

  const isOwner = viewerRole === 'owner';

  const changePlanOptions = useMemo(() => {
    if (!currentPlan) return availablePlans.filter((p) => !p.soldOut);
    return availablePlans.filter(
      (p) => p.id !== currentPlan.id && p.slug !== currentPlan.slug && !p.soldOut
    );
  }, [availablePlans, currentPlan]);

  async function cancelSubscription() {
    const endsLabel = formatBillingDate(billing?.renewsAt ?? null);
    const ok = window.confirm(
      `Cancel your subscription at the end of the current billing period?\n\nYou will keep full access until ${endsLabel}. Your subscription will not renew after that date.`
    );
    if (!ok) return;

    setActionError(null);
    setCancelPending(true);
    try {
      const res = await fetch('/api/stripe/cancel-subscription', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(
          typeof data.error === 'string' ? data.error : 'Could not cancel subscription'
        );
        return;
      }
      await loadBilling();
    } catch {
      setActionError('Could not cancel subscription');
    } finally {
      setCancelPending(false);
    }
  }

  async function reactivateSubscription() {
    setActionError(null);
    setReactivatePending(true);
    try {
      const res = await fetch('/api/stripe/reactivate-subscription', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(
          typeof data.error === 'string' ? data.error : 'Could not keep subscription'
        );
        return;
      }
      await loadBilling();
    } catch {
      setActionError('Could not keep subscription');
    } finally {
      setReactivatePending(false);
    }
  }

  async function selectPlan(planId: string) {
    setActionError(null);
    setChangePlanPendingId(planId);
    try {
      const res = await fetch('/api/stripe/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionPlanId: planId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(typeof data.error === 'string' ? data.error : 'Could not change plan');
        return;
      }
      if (data.mode === 'checkout' && data.url) {
        window.location.href = data.url as string;
        return;
      }
      setChangePlanOpen(false);
      await loadBilling();
    } catch {
      setActionError('Could not change plan');
    } finally {
      setChangePlanPendingId(null);
    }
  }

  const usageLine = seatUsageLine(seatLimits, currentPlan);

  return (
    <div className="max-w-3xl min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your subscription, plan, and team seats.
        </p>
      </div>

      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}
      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      <AccountSecurityCard />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Your plan</h2>
        {currentPlan && !loadError ? (
          <>
            <PricingPlanCard plan={currentPlan} variant="current" />
            {usageLine ? (
              <p className="text-sm text-muted-foreground">{usageLine}</p>
            ) : null}
          </>
        ) : !loadError ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                No active plan on file.{' '}
                {isOwner && billing?.canChangePlan
                  ? 'Choose a plan below to subscribe.'
                  : 'Contact your organization owner to subscribe.'}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Status: {loadError ? '—' : billing?.subscriptionStatus ?? '—'}
            {billing?.renewsAt && !loadError
              ? ` · ${billing.cancelAtPeriodEnd ? 'Access until' : 'Renews'} ${formatBillingDate(billing.renewsAt)}`
              : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {billing?.cancelAtPeriodEnd && billing.renewsAt && !loadError ? (
            <p className="text-sm text-muted-foreground rounded-md border border-border bg-muted/40 px-3 py-2">
              Your subscription is scheduled to cancel on {formatBillingDate(billing.renewsAt)}.
              You keep full access until then.
            </p>
          ) : null}

          {isOwner && !loadError ? (
            <div className="flex flex-wrap gap-2">
              {billing?.canChangePlan ? (
                <Button type="button" variant="secondary" onClick={() => setChangePlanOpen(true)}>
                  Change plan
                </Button>
              ) : null}
              {billing?.canAddSeats && billing.addSeatsHref ? (
                <Button type="button" variant="secondary" asChild>
                  <Link href={billing.addSeatsHref}>Add seats</Link>
                </Button>
              ) : billing?.addSeatsBlockedReason ? (
                <div className="w-full space-y-2">
                  <Button type="button" variant="secondary" disabled>
                    Add seats
                  </Button>
                  <p className="text-xs text-muted-foreground">{billing.addSeatsBlockedReason}</p>
                </div>
              ) : null}
              {billing?.canCancel ? (
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  disabled={cancelPending}
                  onClick={() => void cancelSubscription()}
                >
                  {cancelPending ? 'Scheduling cancellation…' : 'Cancel subscription'}
                </Button>
              ) : null}
              {billing?.canReactivate ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={reactivatePending}
                  onClick={() => void reactivateSubscription()}
                >
                  {reactivatePending ? 'Updating…' : 'Keep subscription'}
                </Button>
              ) : null}
            </div>
          ) : null}

          {!isOwner && !loadError ? (
            <p className="text-xs text-muted-foreground">
              Only the organization owner can change plan, add seats, or cancel billing.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Sheet open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Change plan</SheetTitle>
            <SheetDescription>
              Select a plan. You may be redirected to Stripe checkout for new subscriptions or
              one-time plans. Recurring plan changes are prorated on your current subscription.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {changePlanOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other plans are available right now.</p>
            ) : (
              changePlanOptions.map((plan) => (
                <PricingPlanCard
                  key={plan.id}
                  plan={plan}
                  variant="selectable"
                  compact
                  footer={
                    <Button
                      type="button"
                      className="w-full"
                      disabled={changePlanPendingId !== null}
                      onClick={() => void selectPlan(plan.id)}
                    >
                      {changePlanPendingId === plan.id ? 'Processing…' : `Select ${plan.name}`}
                    </Button>
                  }
                />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl min-w-0 space-y-6">
          <p className="text-sm text-muted-foreground">Loading billing…</p>
        </div>
      }
    >
      <BillingPageInner />
    </Suspense>
  );
}
