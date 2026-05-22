import { CalendarClock, ImageIcon, ListChecks, Rss } from 'lucide-react';
import { RevealOnScroll } from '@/components/marketing/RevealOnScroll';

function BookACallDemo() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Free consult
      </p>
      <p className="text-sm font-medium text-slate-900">Talk to a brand strategist</p>
      <div className="inline-flex items-center gap-2 rounded-md tn-grad-bg px-3 py-1.5 text-xs font-medium text-white shadow-sm">
        <CalendarClock className="h-3.5 w-3.5" aria-hidden />
        Book a call
      </div>
      <p className="text-[11px] text-slate-500">15 min &middot; No commitment</p>
    </div>
  );
}

function ListDemo() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Featured offers
      </p>
      <ul className="space-y-1 text-sm">
        <li className="flex items-start gap-2">
          <span
            className="mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            aria-hidden
          />
          <span className="leading-snug text-slate-900">Spring sale &mdash; 20% off</span>
        </li>
        <li className="flex items-start gap-2">
          <span
            className="mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            aria-hidden
          />
          <span className="leading-snug text-slate-900">Customer stories</span>
        </li>
        <li className="flex items-start gap-2">
          <span
            className="mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            aria-hidden
          />
          <span className="leading-snug text-slate-900">Pricing &amp; plans</span>
        </li>
      </ul>
    </div>
  );
}

function LatestBlogsDemo() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Latest posts
      </p>
      <ul className="space-y-2 text-sm">
        <li>
          <p className="font-medium text-slate-900">Track signature clicks</p>
          <p className="text-[11px] text-slate-500">5 min read &middot; Today</p>
        </li>
        <li>
          <p className="font-medium text-slate-900">Promo blocks 101</p>
          <p className="text-[11px] text-slate-500">3 min read &middot; Mon</p>
        </li>
      </ul>
    </div>
  );
}

function ImageDemo() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Featured promo
      </p>
      <div className="tn-grad-bg-soft relative flex aspect-[4/2.4] items-end justify-start overflow-hidden rounded-md border border-slate-200 bg-white p-3">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#0065c9]/20 via-transparent to-[#4fd6b2]/30"
        />
        <span className="relative inline-flex items-center rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold text-slate-900 shadow-sm">
          Spring promo
        </span>
      </div>
    </div>
  );
}

const BLOCKS = [
  {
    icon: CalendarClock,
    title: 'Book a call',
    description:
      'Embed a one-click scheduler. Every email becomes an invitation to talk. No copy and pasting, and no missed leads.',
    Demo: BookACallDemo,
  },
  {
    icon: ListChecks,
    title: 'Offer + link lists',
    description:
      'Mini menus of offers, resources, or sites you want top-of-mind. Each item carries UTM tracking automatically.',
    Demo: ListDemo,
  },
  {
    icon: Rss,
    title: 'Latest blog posts',
    description:
      'Auto-pull recent articles from any RSS feed so your team always promotes your newest content without a code change.',
    Demo: LatestBlogsDemo,
  },
  {
    icon: ImageIcon,
    title: 'Promo banners',
    description:
      'Drop in a campaign image or seasonal banner. Replace it organization wide in a single edit so every employee email updates.',
    Demo: ImageDemo,
  },
] as const;

export function HomePromoBlocksShowcase() {
  return (
    <section className="container py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Promotional blocks
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Beyond a signature. <span className="tn-grad-text">A promotional tool</span>
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Each Tailnote template can carry one or more promotional blocks beside the signature. Mix
          and match four ready-made types to turn routine email into a marketing channel.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {BLOCKS.map(({ icon: Icon, title, description, Demo }, index) => (
          <RevealOnScroll key={title} delayMs={index * 60} as="article">
            <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-ring">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl tn-grad-bg text-white shadow-sm">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                <Demo />
              </div>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
