import Link from 'next/link';
import { ArrowRight, BarChart3, CalendarRange, Filter, LineChart } from 'lucide-react';
import { FloatingOrbs } from '@/components/marketing/FloatingOrbs';
import { HomeFinalCta } from '@/components/marketing/HomeFinalCta';
import { MarketingAnalyticsShowcase } from '@/components/marketing/MarketingAnalyticsShowcase';
import { RevealOnScroll } from '@/components/marketing/RevealOnScroll';
import { JsonLd } from '@/components/seo/JsonLd';
import { marketingBreadcrumbJsonLd, webPageJsonLd } from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';
import { Button } from '@/components/ui/button';

const page = marketingPageByKey('analytics');

export const metadata = createPageMetadata({
  title: page.title,
  description: page.description,
  path: page.path,
});

const FEATURES = [
  {
    icon: CalendarRange,
    title: 'Flexible date ranges',
    description: 'Review the last 30 days or any window up to 90 days to spot trends and campaign lift.',
  },
  {
    icon: Filter,
    title: 'Per-employee or team-wide',
    description: 'Owners see org-wide clicks; managers can drill into individual senders when needed.',
  },
  {
    icon: LineChart,
    title: 'Clicks over time',
    description: 'Daily charts show whether interest is building — perfect after launching a new promo block.',
  },
  {
    icon: BarChart3,
    title: 'Breakdown by link type',
    description:
      'Compare logo, website, social, and promotional block clicks to see what your audience actually uses.',
  },
] as const;

export default function AnalyticsMarketingPage() {
  return (
    <div className="relative isolate">
      <JsonLd
        data={[
          webPageJsonLd({
            path: page.path,
            name: page.title,
            description: page.description,
          }),
          marketingBreadcrumbJsonLd(page.title, page.path),
        ]}
      />
      <div
        aria-hidden
        className="tn-grad-bg-soft pointer-events-none absolute inset-x-0 -top-20 -z-10 h-[28rem]"
      />
      <FloatingOrbs />

      <div className="container relative py-14 sm:py-20">
        <RevealOnScroll className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Analytics</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Know which signatures <span className="tn-grad-text">drive clicks</span>
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Tailnote tracks clicks on signature links — including every promotional block — so you can
            see what resonates. Pair it with automatic UTM parameters for full-funnel attribution in
            Google Analytics.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 shadow-card">
              <Link href="/signup">
                Get started
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/promotional-blocks">See promotional blocks</Link>
            </Button>
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="mt-14 sm:mt-16" delayMs={80}>
          <MarketingAnalyticsShowcase variant="full" />
        </RevealOnScroll>
      </div>

      <section className="container py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Measure what your team promotes
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built for marketers and founders who want proof that email signatures pull their weight.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }, index) => (
            <RevealOnScroll key={title} delayMs={index * 60}>
              <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-shadow hover:shadow-ring">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <div className="container pb-16 sm:pb-20">
        <RevealOnScroll delayMs={40}>
          <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
            See which promos outperform social and website links
          </p>
          <MarketingAnalyticsShowcase variant="chartDetail" />
        </RevealOnScroll>

        <RevealOnScroll className="mt-16 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-card sm:p-10" delayMs={60}>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            UTM tracking + Google Analytics
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
            Every tracked link in your signature can include UTM parameters automatically — source,
            medium, and campaign — so visits show up in GA alongside the rest of your marketing. Use
            Tailnote click analytics for quick checks, and GA for deeper funnel analysis.
          </p>
        </RevealOnScroll>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          We only record clicks on links you enable for tracking. See our{' '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>{' '}
          for details.
        </p>
      </div>

      <HomeFinalCta />
    </div>
  );
}
