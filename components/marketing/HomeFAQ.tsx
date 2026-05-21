import { Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'How does Tailnote get my signature into Gmail or Outlook?',
    a: 'Tailnote installs to Gmail with a one-click OAuth connection — your whole team can apply on-brand signatures without touching settings. For Outlook and other clients we generate clean HTML you can paste into the standard signature field.',
  },
  {
    q: 'Do I need a designer to set this up?',
    a: 'No. Pick a template, add your logo and brand color, and Tailnote handles the layout, fonts, and spacing. Promotional blocks are filled in with simple forms — buttons, offer lists, blog feeds, or image banners.',
  },
  {
    q: 'Can I track clicks from email signatures?',
    a: 'Yes. Every link in your signature can get UTM parameters appended automatically so visits show up in Google Analytics. You can also see per-template click analytics inside Tailnote.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'You can cancel any plan from your dashboard. Your installed Gmail signatures keep working — Tailnote only stops applying updates and tracking new clicks.',
  },
  {
    q: 'Is there a free tier?',
    a: 'You can sign up free and explore the editor and templates. Active marketing features, team seats, and signature installs require a paid plan — see Pricing for details.',
  },
  {
    q: 'How does Tailnote handle our data?',
    a: 'We store the minimum required to render and install your signatures. We never sell data. Full details are in our Privacy Policy and Terms.',
  },
] as const;

export function HomeFAQ() {
  return (
    <section className="container py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Questions</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Frequently asked
          </h2>
        </div>
        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200/80 bg-white shadow-card">
          {FAQS.map((item, idx) => (
            <details key={idx} className="group px-5 py-4 sm:px-6">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-medium text-foreground">
                <span>{item.q}</span>
                <Plus
                  className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
