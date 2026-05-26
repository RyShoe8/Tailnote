import { RevealOnScroll } from '@/components/marketing/RevealOnScroll';

const STEPS = [
  {
    title: 'Set your brand',
    description:
      'Upload your logo, pick brand colors and a template, and add social links. Then add your customizable promo blocks. Tailnote builds clean, on-brand HTML once.',
  },
  {
    title: 'Add your team',
    description:
      'Invite employees and let them fill in name, title, and contact details. Brand and promo blocks stay locked to your settings.',
  },
  {
    title: 'Copy into your inbox',
    description:
      'Copy your signature from Tailnote, paste into Gmail settings or Outlook, and every outbound email is on-brand.',
  },
] as const;

export function HomeHowItWorks() {
  return (
    <section className="container py-16 sm:py-20 lg:pt-8 lg:pb-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
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
