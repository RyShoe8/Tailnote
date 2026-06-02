'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PublicPricingPlan } from 'billing-engine';
import { CORE_PRODUCT_FEATURE_BULLETS } from '@/lib/marketing/productFeatures';

type OnboardingFormProps = {
  plans: PublicPricingPlan[];
  resumeMode?: boolean;
  organizationName?: string;
};

function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function intervalSuffix(interval: PublicPricingPlan['interval']): string {
  switch (interval) {
    case 'month':
      return '/mo';
    case 'year':
      return '/yr';
    case 'lifetime':
      return '';
    default:
      return '';
  }
}

function primaryPriceLine(plan: PublicPricingPlan): string {
  if (plan.interval === 'lifetime') {
    return `${formatUsd(plan.basePriceCents)} one-time`;
  }
  return `${formatUsd(plan.basePriceCents)}${intervalSuffix(plan.interval)}`;
}

function includedUsersSummary(plan: PublicPricingPlan): string {
  const n = Math.max(1, plan.includedUsers);
  return `${n} user${n === 1 ? '' : 's'} included`;
}

function resolveInitialPlanId(plans: PublicPricingPlan[], searchParams: URLSearchParams): string {
  const byId = searchParams.get('subscriptionPlanId')?.trim();
  if (byId && plans.some((p) => p.id === byId && !p.soldOut)) return byId;

  const slug = searchParams.get('plan')?.trim().toLowerCase();
  if (slug) {
    const match = plans.find((p) => p.slug === slug && !p.soldOut);
    if (match) return match.id;
  }

  const popular = plans.find((p) => p.badge.trim().toLowerCase() === 'popular' && !p.soldOut);
  if (popular) return popular.id;

  const first = plans.find((p) => !p.soldOut);
  return first?.id ?? '';
}

function parseApiError(data: unknown, status: number): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === 'string' && err.trim()) return err;
  }
  return `Request failed (${status})`;
}

export function OnboardingForm({ plans, resumeMode = false, organizationName }: OnboardingFormProps) {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('checkout') === 'cancelled';

  const initialPlanId = useMemo(
    () => resolveInitialPlanId(plans, searchParams),
    [plans, searchParams]
  );

  const [name, setName] = useState(organizationName ?? '');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const offerablePlans = plans.filter((p) => !p.soldOut);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const selectedPlanIsFree = Boolean(selectedPlan && selectedPlan.basePriceCents === 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedPlanId) {
      setError('Select a subscription plan to continue.');
      return;
    }
    if (!resumeMode && !name.trim()) {
      setError('Enter your company name.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = resumeMode ? '/api/onboarding/checkout' : '/api/onboarding/organization';
      const body = resumeMode
        ? { subscriptionPlanId: selectedPlanId }
        : { name: name.trim(), subscriptionPlanId: selectedPlanId };

      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(parseApiError(data, res.status));
        return;
      }
      const checkoutUrl =
        data && typeof data === 'object' && 'checkoutUrl' in data
          ? (data as { checkoutUrl?: string }).checkoutUrl
          : undefined;
      if (!checkoutUrl) {
        setError('Checkout did not return a payment URL.');
        return;
      }
      window.location.href = checkoutUrl;
    } catch {
      setError('Request failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full min-w-0 max-w-2xl shadow-card">
      <CardHeader>
        <CardTitle>{resumeMode ? 'Complete your subscription' : 'Create your organization'}</CardTitle>
        <CardDescription>
          {resumeMode ? (
            <>
              {cancelled ? (
                <span className="text-destructive">Payment was cancelled. </span>
              ) : null}
              Choose a plan to activate Tailnote
              {organizationName ? ` for ${organizationName}` : ''}.
            </>
          ) : (
            'Enter your company name and choose a plan to create your workspace.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {!resumeMode ? (
            <div className="space-y-2">
              <Label htmlFor="name">Company name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="organization"
              />
            </div>
          ) : null}

          <div className="space-y-3">
            <Label>Subscription plan</Label>
            {offerablePlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No plans are available right now. Please contact support.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {plans.map((plan) => {
                  const selected = selectedPlanId === plan.id;
                  const recommended = plan.badge.trim().toLowerCase() === 'popular';
                  const disabled = plan.soldOut;

                  return (
                    <label
                      key={plan.id}
                      className={`relative flex cursor-pointer flex-col rounded-xl border p-4 transition-shadow ${
                        disabled
                          ? 'cursor-not-allowed border-slate-200/60 bg-muted/30 opacity-60'
                          : selected
                            ? 'border-primary ring-2 ring-primary/30 shadow-card'
                            : 'border-slate-200/80 bg-white hover:shadow-card'
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selected}
                        disabled={disabled}
                        onChange={() => setSelectedPlanId(plan.id)}
                        className="sr-only"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{plan.name}</span>
                        {recommended ? (
                          <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                            Popular
                          </span>
                        ) : null}
                        {plan.soldOut ? (
                          <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            Sold out
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">
                        {primaryPriceLine(plan)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{includedUsersSummary(plan)}</p>
                      {plan.description.trim() ? (
                        <p className="mt-2 text-sm text-muted-foreground">{plan.description.trim()}</p>
                      ) : null}
                      <ul className="mt-3 space-y-1.5">
                        {CORE_PRODUCT_FEATURE_BULLETS.slice(0, 3).map((line) => (
                          <li
                            key={line}
                            className="flex items-start gap-2 text-xs text-muted-foreground"
                          >
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || offerablePlans.length === 0 || !selectedPlanId}
          >
            {loading
              ? selectedPlanIsFree
                ? 'Setting up workspace…'
                : 'Redirecting to checkout…'
              : selectedPlanIsFree
                ? 'Continue with Free'
                : 'Continue to payment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
