import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HomeFinalCta() {
  return (
    <section className="container py-16 sm:py-20 lg:py-24">
      <div className="tn-grad-bg-dark relative isolate overflow-hidden rounded-3xl px-6 py-14 text-center text-white shadow-ring sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2"
        >
          <div className="tn-float-slow h-full w-full rounded-full bg-white/10 blur-3xl" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -bottom-10 h-72 w-72"
        >
          <div className="tn-drift tn-float-delay-2 h-full w-full rounded-full bg-[#4fd6b2]/30 blur-3xl" />
        </div>
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          Every email your team sends is a missed opportunity —{' '}
          <span className="tn-grad-text">until now</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-white/80 sm:text-lg">
          Teams using branded signatures see up to 32% more replies and 3× more clicks to their website.
        </p>
        <p className="mx-auto mt-2 max-w-xl text-pretty text-base text-white/70 sm:text-lg">
          Join teams using Tailnote to promote offers, track clicks and opens, and keep every
          outbound message on-brand.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="gap-2 bg-white text-slate-900 shadow-card hover:bg-white/90"
          >
            <Link href="/signup">
              Start free today
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="gap-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/pricing">
              View pricing
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
