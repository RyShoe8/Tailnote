import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PublicPricingPlan } from 'billing-engine';

function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function intervalLabel(interval: PublicPricingPlan['interval']): string {
  switch (interval) {
    case 'month':
      return 'month';
    case 'year':
      return 'year';
    case 'lifetime':
      return 'one-time';
    default:
      return interval;
  }
}

function lowestPricedPlan(plans: PublicPricingPlan[]): PublicPricingPlan | null {
  if (plans.length === 0) return null;
  return [...plans].sort((a, b) => a.basePriceCents - b.basePriceCents)[0] ?? null;
}

type Props = {
  plans: PublicPricingPlan[];
};

export function HomePricingTeaser({ plans }: Props) {
  const lowest = lowestPricedPlan(plans.filter((p) => !p.soldOut));
  const fallback = lowest ?? lowestPricedPlan(plans);

  return (
    <section className="container py-16 sm:py-20 lg:py-24">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card sm:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#0065c9]/15 via-[#0c8fa3]/10 to-[#4fd6b2]/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-2xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Marketing-grade signatures{' '}
              <span className="tn-grad-text">without the enterprise setup</span>
            </h2>
            <p className="text-pretty text-muted-foreground">
              No seat minimums, no IT project, no OAuth. Most signature tools are built for big
              companies with admin deployment and 10-seat minimums — Tailnote works for a team of
              one, with on-brand signatures, promotional blocks, UTM tracking, and copy-paste
              install for Gmail and Outlook.
            </p>
            {fallback ? (
              <>
                <p className="text-lg font-medium text-foreground">
                  Plans from{' '}
                  <span className="tn-grad-text font-semibold">
                    {formatUsd(fallback.basePriceCents)}
                    {fallback.interval === 'lifetime' ? '' : ` / ${intervalLabel(fallback.interval)}`}
                  </span>{' '}
                  per subscription
                </p>
                <p className="text-sm text-muted-foreground">
                  Simple per-subscription pricing — add teammates as you grow.
                </p>
              </>
            ) : null}
            {plans.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {plans.map((p) => (
                  <span
                    key={p.slug}
                    className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <Button asChild size="lg" className="shrink-0 gap-2 self-start shadow-card lg:self-center">
            <Link href="/pricing">
              See pricing
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
