import { FloatingOrbs } from '@/components/marketing/FloatingOrbs';
import { RevealOnScroll } from '@/components/marketing/RevealOnScroll';

export function BlogHero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="tn-grad-bg-soft pointer-events-none absolute inset-0" />
      <FloatingOrbs />
      <div className="container relative py-14 sm:py-20">
        <RevealOnScroll>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Tailnote Blog</p>
          <h1 className="mt-3 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Email signatures, deliverability, and team branding
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
            Practical guides for solo founders and SMB teams — SPF, DKIM, DMARC, signature best
            practices, and branded outbound email.
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
