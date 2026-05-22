'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountSecurityCard } from '@/components/dashboard/AccountSecurityCard';

export default function BillingPage() {
  const [org, setOrg] = useState<Record<string, unknown> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);

    fetch('/api/dashboard/organization')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            typeof data.error === 'string' ? data.error : 'Could not load billing status';
          throw new Error(msg);
        }
        if (!cancelled) setOrg(data.organization ?? null);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setOrg(null);
          setLoadError(e instanceof Error ? e.message : 'Could not load billing status');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function checkout(plan: 'basic' | 'pro') {
    setCheckoutError(null);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCheckoutError(typeof data.error === 'string' ? data.error : 'Could not start checkout');
      return;
    }
    if (data.url) window.location.href = data.url as string;
    else setCheckoutError('Checkout did not return a payment URL');
  }

  async function portal() {
    setCheckoutError(null);
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCheckoutError(typeof data.error === 'string' ? data.error : 'Could not open billing portal');
      return;
    }
    if (data.url) window.location.href = data.url as string;
    else setCheckoutError('Portal did not return a URL');
  }

  return (
    <div className="max-w-xl min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">Flat organization subscription. Change prices in Stripe.</p>
      </div>
      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}
      {checkoutError ? (
        <p className="text-sm text-destructive" role="alert">
          {checkoutError}
        </p>
      ) : null}
      <AccountSecurityCard />
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>Plan and subscription state from Stripe webhooks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Plan:</span>{' '}
            {loadError ? '—' : String(org?.plan ?? '—')}
          </p>
          <p>
            <span className="text-muted-foreground">Subscription:</span>{' '}
            {loadError ? '—' : String(org?.subscriptionStatus ?? '—')}
          </p>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => void checkout('basic')} disabled={Boolean(loadError)}>
          Checkout Basic
        </Button>
        <Button type="button" onClick={() => void checkout('pro')} disabled={Boolean(loadError)}>
          Checkout Pro
        </Button>
        <Button type="button" variant="outline" onClick={() => void portal()} disabled={Boolean(loadError)}>
          Customer portal
        </Button>
      </div>
    </div>
  );
}
