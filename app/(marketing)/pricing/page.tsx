import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { JsonLd } from '@/components/seo/JsonLd';
import { FloatingOrbs } from '@/components/marketing/FloatingOrbs';
import { RevealOnScroll } from '@/components/marketing/RevealOnScroll';
import { getPublicPricingPlans, type PublicPricingPlan } from '@/lib/billing/getPublicPricingPlans';
import { CORE_PRODUCT_FEATURE_BULLETS } from '@/lib/marketing/productFeatures';
import { softwareApplicationJsonLd, webPageJsonLd } from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';

export const dynamic = 'force-dynamic';

const pricingPage = marketingPageByKey('pricing');

export const metadata = createPageMetadata({
  title: pricingPage.title,
  description: pricingPage.description,
  path: pricingPage.path,
});

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

function seatPolicyLine(plan: PublicPricingPlan): string | null {
  if (plan.interval === 'lifetime') return null;
  if (plan.additionalUserPriceCents > 0) {
    return `Add more users anytime for ${formatUsd(plan.additionalUserPriceCents)} per user${intervalSuffix(plan.interval)}`;
  }
  return 'No additional seats available on this plan';
}

function subscriptionCap(plan: PublicPricingPlan): { max: number; remaining: number } | null {
  const max = plan.maxSubscriptionSlots;
  if (max <= 0) return null;
  return { max, remaining: Math.max(0, max - plan.subscriptionCount) };
}

function planFeatureBullets(plan: PublicPricingPlan): string[] {
  const seats = seatPolicyLine(plan);
  return [...CORE_PRODUCT_FEATURE_BULLETS, ...(seats ? [seats] : [])];
}

function SubscriptionAvailabilityCallout({ plan }: { plan: PublicPricingPlan }) {
  const cap = subscriptionCap(plan);
  if (!cap) return null;

  if (plan.soldOut) {
    return (
      <div className="rounded-xl border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Sold out</p>
        <p className="mt-1 text-lg font-semibold text-destructive">All {cap.max} subscriptions claimed</p>
        <p className="text-sm text-muted-foreground">Check back later or choose another plan</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/25 bg-primary/5 px-4 py-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Limited availability</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{cap.remaining}</p>
      <p className="text-sm text-muted-foreground">
        of {cap.max} subscription{cap.max === 1 ? '' : 's'} still available — claim yours before
        they&apos;re gone
      </p>
    </div>
  );
}

export default async function PricingPage() {
  const plans = await getPublicPricingPlans();

  return (
    <div className="relative isolate">
      <JsonLd
        data={[
          webPageJsonLd({
            path: pricingPage.path,
            name: pricingPage.title,
            description: pricingPage.description,
          }),
          softwareApplicationJsonLd(),
        ]}
      />
      <div
        aria-hidden
        className="tn-grad-bg-soft pointer-events-none absolute inset-x-0 -top-20 -z-10 h-[28rem]"
      />
      <FloatingOrbs />
      <div className="container relative py-14 sm:py-20">
        <div className="tn-rise mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Simple plans, <span className="tn-grad-text">measurable email impact</span>
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Billed per subscription. Each plan includes a set number of users for your organization
            — signatures, promotional blocks, UTM tracking, and analytics included. Pick a plan, sign
            up, and complete checkout to activate your workspace.
          </p>
        </div>
        {plans.length === 0 ? (
          <p className="mx-auto mt-12 max-w-md text-center text-sm text-muted-foreground">
            No public plans are available right now. Please check back later or contact support.
          </p>
        ) : (
          <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
            {plans.map((plan, index) => {
              const description = plan.description.trim();
              const features = planFeatureBullets(plan);
              const hasCap = subscriptionCap(plan) !== null;
              const recommended = plan.badge.trim().toLowerCase() === 'popular';

              return (
                <RevealOnScroll key={plan.slug} delayMs={index * 80} className="flex">
                <Card
                  className={`relative flex w-full flex-col overflow-hidden border-slate-200/80 bg-white shadow-float ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-ring ${
                    recommended ? 'ring-2 ring-primary/40' : ''
                  }`}
                >
                  {recommended ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-1 tn-grad-bg"
                    />
                  ) : null}
                  <CardHeader className="space-y-3 pt-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      {plan.badge.trim() ? (
                        <span className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {plan.badge.trim()}
                        </span>
                      ) : null}
                      {plan.soldOut ? (
                        <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                          Sold out
                        </span>
                      ) : null}
                    </div>
                    {description ? (
                      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                    ) : null}
                    {hasCap ? <SubscriptionAvailabilityCallout plan={plan} /> : null}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-5">
                    <div>
                      <p className="text-4xl font-semibold tracking-tight">{primaryPriceLine(plan)}</p>
                      <p className="mt-3 text-base font-medium text-foreground">
                        {includedUsersSummary(plan)}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">Per subscription</p>
                    </div>
                    <ul className="space-y-2.5">
                      {features.map((line) => (
                        <li key={line} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                            aria-hidden
                          />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="mt-auto">
                    {plan.soldOut ? (
                      <Button className="w-full" disabled>
                        Sold out
                      </Button>
                    ) : (
                      <Button asChild className="w-full shadow-card">
                        <Link href={`/signup?subscriptionPlanId=${encodeURIComponent(plan.id)}`}>
                          Get started — {plan.name}
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
                </RevealOnScroll>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
