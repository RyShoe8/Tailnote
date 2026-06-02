import '@/lib/billing-engine';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PricingPlanCard } from 'billing-engine/next/components';
import { JsonLd } from '@/components/seo/JsonLd';
import { FloatingOrbs } from '@/components/marketing/FloatingOrbs';
import { RevealOnScroll } from '@/components/marketing/RevealOnScroll';
import { getPublicPricingPlans } from 'billing-engine';
import { isRecommendedPlan } from 'billing-engine/pricing-display';
import type { PublicPricingPlan } from 'billing-engine';
import {
  marketingBreadcrumbJsonLd,
  pricingPlansJsonLd,
  softwareApplicationJsonLd,
  webPageJsonLd,
} from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';

export const dynamic = 'force-dynamic';

const pricingPage = marketingPageByKey('pricing');

export const metadata = createPageMetadata({
  title: pricingPage.title,
  description: pricingPage.description,
  path: pricingPage.path,
});

function isFreePricingPlan(plan: PublicPricingPlan): boolean {
  return plan.slug.trim().toLowerCase() === 'free' || plan.basePriceCents === 0;
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
          marketingBreadcrumbJsonLd(pricingPage.title, pricingPage.path),
          ...(plans.length > 0 ? [pricingPlansJsonLd(plans)] : []),
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
            Choose Free for core signature generation or upgrade to paid plans for branding removal,
            team analytics, and tracking. Each plan includes a set number of users for your
            organization.
          </p>
        </div>
        {plans.length === 0 ? (
          <p className="mx-auto mt-12 max-w-md text-center text-sm text-muted-foreground">
            No public plans are available right now. Please check back later or contact support.
          </p>
        ) : (
          <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
            {plans.map((plan, index) => (
              <RevealOnScroll key={plan.slug} delayMs={index * 80} className="flex">
                <PricingPlanCard
                  plan={plan}
                  variant="marketing"
                  className={isRecommendedPlan(plan) ? 'ring-2 ring-primary/40' : undefined}
                  footer={
                    plan.soldOut ? (
                      <Button className="w-full" disabled>
                        Sold out
                      </Button>
                    ) : isFreePricingPlan(plan) ? (
                      <Button asChild className="w-full shadow-card">
                        <Link href="/signup">Get started free</Link>
                      </Button>
                    ) : (
                      <Button asChild className="w-full shadow-card">
                        <Link href={`/signup?subscriptionPlanId=${encodeURIComponent(plan.id)}`}>
                          Get started — {plan.name}
                        </Link>
                      </Button>
                    )
                  }
                />
              </RevealOnScroll>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
