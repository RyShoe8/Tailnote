import { BarChart3, LayoutTemplate, Link2, Mail, Megaphone, Users } from 'lucide-react';
import { RevealOnScroll } from '@/components/marketing/RevealOnScroll';

const FEATURES = [
  {
    icon: Megaphone,
    title: 'Promotional content blocks',
    description:
      'Turn every send into a click. Add book-a-call buttons, offer lists, Dynamic Content that auto-updates as a live image, and banners below your signature — users see up to 2.4× more traffic to linked pages.',
  },
  {
    icon: Link2,
    title: 'Built-in UTM tracking',
    description:
      'Know exactly which signatures generate pipeline. Every promo-block link is automatically tagged so Google Analytics shows you the real ROI of your email channel.',
  },
  {
    icon: LayoutTemplate,
    title: 'Curated signatures',
    description:
      'Nine polished layouts — including our new Modern Professional template — designed to look sharp in Gmail, Outlook, and Apple Mail. No HTML skills needed.',
  },
  {
    icon: BarChart3,
    title: 'Click and open analytics',
    description:
      'See who opened, what they clicked, and when. Track performance per employee or team-wide to find your top performers and optimize send times.',
  },
  {
    icon: Mail,
    title: 'Gmail, Outlook + Apple Mail ready',
    description:
      'Copy your signature and paste — it just works. Tailnote renders pixel-perfect HTML that looks great across every major email client, desktop and mobile.',
  },
  {
    icon: Users,
    title: 'Team-wide control',
    description:
      'Lock brand elements org-wide while letting employees personalize their own details. One admin update rolls out to everyone on the next send.',
  },
] as const;

export function HomeFeatures() {
  return (
    <section className="container py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Why teams choose Tailnote</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Features that drive <span className="tn-grad-text">measurable results</span>
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Tailnote combines on-brand email signatures with promotional blocks, measurable links, and
          optional open tracking—so every employee email promotes your business without extra tools.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {FEATURES.map(({ icon: Icon, title, description }, index) => (
          <RevealOnScroll key={title} delayMs={index * 60}>
            <div className="tn-card-premium group relative h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-ring">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl tn-grad-bg text-white shadow-sm">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="font-semibold tracking-tight text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
