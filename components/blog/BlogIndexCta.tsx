import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BlogIndexCta() {
  return (
    <section className="container py-16 sm:py-20 lg:py-24">
      <div className="tn-grad-bg-dark relative isolate overflow-hidden rounded-3xl px-6 py-14 text-center text-white shadow-ring sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2"
        >
          <div className="tn-float-slow h-full w-full rounded-full bg-white/10 blur-3xl" />
        </div>
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Turn every employee email into a branded touchpoint
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-white/80 sm:text-lg">
          Tailnote helps solo founders and SMB teams deploy consistent signatures, promotional
          blocks, and click tracking — without IT overhead.
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
