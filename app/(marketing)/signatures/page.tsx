import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Check,
  LayoutTemplate,
  Mail,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { FloatingOrbs } from '@/components/marketing/FloatingOrbs';
import { HomeFinalCta } from '@/components/marketing/HomeFinalCta';
import { MarketingLiveSignaturePreview } from '@/components/marketing/MarketingLiveSignaturePreview';
import { RevealOnScroll } from '@/components/marketing/RevealOnScroll';
import { JsonLd } from '@/components/seo/JsonLd';
import { marketingBreadcrumbJsonLd, webPageJsonLd } from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';
import { renderMarketingSample } from '@/lib/marketing/renderMarketingSample';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

const signaturesPage = marketingPageByKey('signatures');

export const metadata = createPageMetadata({
  title: signaturesPage.title,
  description: signaturesPage.description,
  path: signaturesPage.path,
});

const FEATURES = [
  {
    icon: Users,
    title: 'Consistent team branding',
    description:
      'Set logo, colors, fonts, and social links once. Every employee signature stays on-brand without manual HTML edits.',
  },
  {
    icon: Mail,
    title: 'Gmail and Outlook ready',
    description:
      'Copy HTML built for real inboxes — not a design tool export that breaks in Outlook. Install in minutes.',
  },
  {
    icon: Sparkles,
    title: 'Promotional blocks',
    description:
      'Add book-a-call buttons, offer lists, RSS feeds, and banners below the signature so every send can promote something new.',
  },
  {
    icon: BarChart3,
    title: 'Analytics on paid plans',
    description:
      'Track link clicks and optional opens when you upgrade. See which signatures and promo blocks get engagement.',
  },
] as const;

const STEPS = [
  {
    title: 'Create your organization',
    description: 'Sign up free, add your company details, and pick a layout preset.',
  },
  {
    title: 'Customize brand and blocks',
    description: 'Upload your logo, set colors, and add promotional content blocks for the whole team.',
  },
  {
    title: 'Copy into your inbox',
    description: 'Paste the signature into Gmail or Outlook. Updates roll out when you change org defaults.',
  },
] as const;

const FREE_INCLUDED = [
  'Core signature for one user',
  'Layout presets (up to 4)',
  'Promotional content blocks',
  'Gmail and Outlook install',
] as const;

const FREE_EXCLUDED = [
  'Remove Tailnote branding',
  'Click and open analytics',
  'Additional team seats',
] as const;

const PAID_HIGHLIGHTS = [
  'Remove Powered by Tailnote attribution',
  'Click and open analytics',
  'More seats and full preset library',
  'Signature animation slot',
] as const;

export default function SignaturesLandingPage() {
  const previewHtml = renderMarketingSample('corporate');

  return (
    <div className="relative isolate">
      <JsonLd
        data={[
          webPageJsonLd({
            path: signaturesPage.path,
            name: signaturesPage.title,
            description: signaturesPage.description,
          }),
          marketingBreadcrumbJsonLd(signaturesPage.title, signaturesPage.path),
        ]}
      />
      <div
        aria-hidden
        className="tn-grad-bg-soft pointer-events-none absolute inset-x-0 -top-20 -z-10 h-[28rem]"
      />
      <FloatingOrbs />

      <div className="container relative py-14 sm:py-20">
        <RevealOnScroll className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Powered by Tailnote</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Professional email signatures,{' '}
            <span className="tn-grad-text">built for teams</span>
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            You are seeing this page because an email signature was created with Tailnote. We help
            teams ship clean, consistent signatures with promotional content and optional engagement
            tracking — starting free, with room to grow.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 shadow-card">
              <Link href="/signup">
                Create your signature
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="mx-auto mt-14 max-w-3xl sm:mt-16" delayMs={60}>
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Why this signature includes Tailnote
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Free Tailnote plans include a subtle &ldquo;Powered by Tailnote&rdquo; link on exported
            signatures — the same link that brought you here. It helps us offer core signature tools at
            no cost. Paid plans remove that attribution and unlock analytics, more seats, and the full
            template library.
          </p>
        </RevealOnScroll>
      </div>

      <section className="container py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            What you can do <span className="tn-grad-text">with Tailnote</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Whether you are a solo founder or a growing team, Tailnote keeps outbound email on-brand and
            measurable.
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

      <section className="container pb-16 sm:pb-20">
        <RevealOnScroll delayMs={40}>
          <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
            Example signature with promotional content
          </p>
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-float ring-1 ring-black/5 sm:p-6">
            <MarketingLiveSignaturePreview
              presetId="corporate"
              html={previewHtml}
              appearance="flat"
              fitContained
            />
          </div>
        </RevealOnScroll>
      </section>

      <section className="container py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Free vs <span className="tn-grad-text">paid</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free with one user. Upgrade when you need branding removal, analytics, or more seats.{' '}
            <Link href="/pricing" className="underline underline-offset-4">
              Compare all plans
            </Link>
            .
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
          <RevealOnScroll delayMs={0}>
            <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
              <h3 className="text-lg font-semibold tracking-tight">Free</h3>
              <p className="mt-1 text-sm text-muted-foreground">Core signatures with attribution</p>
              <ul className="mt-5 space-y-2.5">
                {FREE_INCLUDED.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Not included
              </p>
              <ul className="mt-2 space-y-2.5">
                {FREE_EXCLUDED.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delayMs={80}>
            <div className="h-full rounded-2xl border border-primary/30 bg-white p-6 shadow-card ring-1 ring-primary/20">
              <h3 className="text-lg font-semibold tracking-tight">Paid</h3>
              <p className="mt-1 text-sm text-muted-foreground">Full platform for growing teams</p>
              <ul className="mt-5 space-y-2.5">
                {PAID_HIGHLIGHTS.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full shadow-card">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="container py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-muted-foreground">Three steps from signup to sending.</p>
        </div>
        <ol className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <RevealOnScroll key={step.title} delayMs={index * 70}>
              <li className="text-center sm:text-left">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </li>
            </RevealOnScroll>
          ))}
        </ol>
      </section>

      <section className="container pb-16 sm:pb-20">
        <RevealOnScroll className="mx-auto max-w-2xl text-center" delayMs={40}>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LayoutTemplate className="h-5 w-5" aria-hidden />
          </div>
          <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Explore Tailnote
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Templates, promotional blocks, analytics, and guides for better outbound email.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/templates">Templates</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/promotional-blocks">Promotional blocks</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/analytics">Analytics</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/blog">Blog</Link>
            </Button>
          </div>
        </RevealOnScroll>
      </section>

      <HomeFinalCta />
    </div>
  );
}
