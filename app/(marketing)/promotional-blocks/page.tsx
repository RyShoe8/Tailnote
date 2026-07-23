import Link from 'next/link';
import { ArrowRight, Link2, RefreshCw, Users } from 'lucide-react';
import { FloatingOrbs } from '@/components/marketing/FloatingOrbs';
import { HomeFinalCta } from '@/components/marketing/HomeFinalCta';
import { MarketingPromoEditorMock } from '@/components/marketing/MarketingPromoEditorMock';
import { MarketingPromoInEmailShowcase } from '@/components/marketing/MarketingPromoInEmailShowcase';
import { PromoBlocksShowcase } from '@/components/marketing/PromoBlocksShowcase';
import { RevealOnScroll } from '@/components/marketing/RevealOnScroll';
import { JsonLd } from '@/components/seo/JsonLd';
import { marketingBreadcrumbJsonLd, webPageJsonLd } from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';
import { Button } from '@/components/ui/button';

const page = marketingPageByKey('promotionalBlocks');

export const metadata = createPageMetadata({
  title: page.title,
  description: page.description,
  path: page.path,
});

const BENEFITS = [
  {
    icon: RefreshCw,
    title: 'One edit, whole team',
    description:
      'Swap a campaign banner or offer list once — every employee signature updates on the next send. No chasing down HTML files.',
  },
  {
    icon: Link2,
    title: 'UTM on every link',
    description:
      'Promo block links get UTM parameters automatically so you can attribute traffic in Google Analytics.',
  },
  {
    icon: Users,
    title: 'Control who can customize',
    description:
      'Lock promo blocks org-wide for brand consistency, or let employees personalize when you want local flexibility.',
  },
] as const;

const STEPS = [
  {
    title: 'Add your blocks',
    description: 'Pick book-a-call, lists, Dynamic Content, banners, image links, or quotes from our library (or your own) — no HTML required.',
  },
  {
    title: 'Set org defaults',
    description: 'Choose which blocks every employee gets. Toggle on/off or update copy in one place.',
  },
  {
    title: 'Send and promote',
    description: 'Copy into Gmail or paste into Outlook. Every outbound email carries your latest offer.',
  },
] as const;

export default function PromotionalBlocksPage() {
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
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Promotional blocks</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Every email carries <span className="tn-grad-text">your offer</span>
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Go beyond a static signature. Tailnote promotional blocks turn routine outbound mail into
            mini campaigns — book-a-call buttons, offer lists, blog feeds, banners, image links, and
            quotes that drive up to 3× more website traffic.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 shadow-card">
              <Link href="/signup">
                Get started
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/signatures">Browse signatures</Link>
            </Button>
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="mt-14 sm:mt-16" delayMs={80}>
          <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
            Promotional blocks inside a real sent email
          </p>
          <MarketingPromoInEmailShowcase />
        </RevealOnScroll>
      </div>

      <section className="container py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Six block types, <span className="tn-grad-text">mix and match</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Each block is designed for real email clients — not a drag-and-drop canvas that breaks in
            Outlook.
          </p>
        </div>
        <div className="mt-12">
          <PromoBlocksShowcase showHeader={false} />
        </div>
      </section>

      <section className="container py-16 sm:py-20 border-y border-slate-200/50 bg-slate-50/50">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Built-in Quote Library
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Not sure what to say? Tailnote includes a curated library of business, marketing, and leadership quotes that you can rotate automatically in your team&apos;s signatures. Keep your emails fresh and inspiring without writing new copy every week.
          </p>
        </div>
      </section>

      <div className="container py-16 sm:py-20 pb-16 sm:pb-20">
        <RevealOnScroll delayMs={60}>
          <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
            Manage blocks once for your whole organization
          </p>
          <MarketingPromoEditorMock />
        </RevealOnScroll>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, description }, index) => (
            <RevealOnScroll key={title} delayMs={index * 70}>
              <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-tight">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <section className="mt-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              From offer to inbox in three steps
            </h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, idx) => (
              <RevealOnScroll key={step.title} as="li" delayMs={idx * 80}>
                <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full tn-grad-bg text-sm font-semibold text-white shadow-sm">
                      {idx + 1}
                    </span>
                    <h3 className="font-semibold tracking-tight">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </RevealOnScroll>
            ))}
          </ol>
        </section>
      </div>

      <HomeFinalCta />
    </div>
  );
}
