import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmailClientMock } from '@/components/marketing/EmailClientMock';
import { renderMarketingSample } from '@/lib/marketing/renderMarketingSample';
import { stripSignaturePreviewLinks } from '@/lib/marketing/stripSignaturePreviewLinks';

export function HomeHero() {
  const signatureHtml = stripSignaturePreviewLinks(renderMarketingSample('default'));

  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="tn-grad-bg-soft pointer-events-none absolute inset-x-0 -top-32 -z-10 h-[40rem]"
      />
      <div className="container relative pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-28 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          <div className="tn-rise mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              New: Creator and Executive layouts
            </span>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Turn every email into a{' '}
              <span className="tn-grad-text">marketing moment</span>
            </h1>
            <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
              Tailnote pairs on-brand signatures with promotional content blocks, built-in UTM
              tracking, and click analytics. Polished layouts that hold up in Gmail, Outlook, and
              everywhere in between.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button asChild size="lg" className="gap-2 shadow-card">
                <Link href="/signup">
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required &middot; Install to Gmail in one click
            </p>
          </div>

          <div className="tn-rise tn-rise-delay-2 min-w-0">
            <EmailClientMock signatureHtml={signatureHtml} />
          </div>
        </div>
      </div>
    </section>
  );
}
