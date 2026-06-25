import { RevealOnScroll } from '@/components/marketing/RevealOnScroll';

const STEPS = [
  {
    title: 'Set your brand',
    description:
      'Upload your logo, choose brand colors and fonts, add social links. Your entire team inherits the same look.',
  },
  {
    title: 'Add your team',
    description:
      'Add employees by email. They get a pre-filled signature with their own name and title — brand settings stay locked.',
  },
  {
    title: 'Copy into your inbox',
    description:
      'Each employee copies their signature into Gmail, Outlook, or Apple Mail. Every outbound email now carries your brand and promos.',
  },
] as const;

export function HomeHowItWorks() {
  return (
    <section className="container py-16 sm:py-20 lg:pt-8 lg:pb-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full tn-grad-bg text-white px-4 py-1.5 text-xs font-semibold tracking-wide shadow-sm">
          Setup in under 2 minutes
        </span>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          From brand to inbox in three steps
        </h2>
      </div>
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, idx) => (
          <RevealOnScroll key={step.title} as="li" delayMs={idx * 80}>
            <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-ring">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full tn-grad-bg text-sm font-semibold text-white shadow-sm">
                  {idx + 1}
                </span>
                <h3 className="font-semibold tracking-tight text-foreground">{step.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          </RevealOnScroll>
        ))}
      </ol>
    </section>
  );
}
