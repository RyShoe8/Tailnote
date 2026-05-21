const STEPS = [
  {
    title: 'Set your brand',
    description:
      'Upload your logo, pick brand colors and a template, and add social links. Tailnote builds clean, on-brand HTML once.',
  },
  {
    title: 'Add your team',
    description:
      'Invite employees and let them fill in name, title, and contact details. Brand and promo blocks stay locked to your settings.',
  },
  {
    title: 'Install in one click',
    description:
      "Connect Gmail to apply signatures automatically, or copy HTML that pastes into Outlook and any other client.",
  },
] as const;

export function HomeHowItWorks() {
  return (
    <section className="container py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          From brand to inbox in three steps
        </h2>
      </div>
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, idx) => (
          <li
            key={step.title}
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full tn-grad-bg text-sm font-semibold text-white shadow-sm">
                {idx + 1}
              </span>
              <h3 className="font-semibold tracking-tight text-foreground">{step.title}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
