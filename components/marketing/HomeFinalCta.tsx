import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HomeFinalCta() {
  return (
    <section className="container py-16 sm:py-20 lg:py-24">
      <div className="tn-grad-bg-dark relative isolate overflow-hidden rounded-3xl px-6 py-14 text-center text-white shadow-ring sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -bottom-10 h-72 w-72 rounded-full bg-[#4fd6b2]/30 blur-3xl"
        />
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          Ready to market in every email your team sends?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-white/80 sm:text-lg">
          Join teams using Tailnote to promote offers, track clicks, and keep every outbound message
          on-brand.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-10 gap-2 bg-white text-slate-900 shadow-card hover:bg-white/90"
        >
          <Link href="/signup">
            Create your account
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
