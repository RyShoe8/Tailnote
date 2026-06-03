import { BarChart3, LayoutTemplate, Link2, Mail, Megaphone, Users } from 'lucide-react';
import { RevealOnScroll } from '@/components/marketing/RevealOnScroll';

const FEATURES = [
  {
    icon: Megaphone,
    title: 'Promotional content blocks',
    description:
      'Book-a-call buttons, offer lists, blog feeds, and image banners live next to every signature. Tailnote turns routine emails into mini campaigns.',
  },
  {
    icon: Link2,
    title: 'Built-in UTM tracking',
    description:
      'Every link gets UTM parameters automatically so you can attribute site visits and conversions to email in Google Analytics.',
  },
  {
    icon: LayoutTemplate,
    title: 'Curated signatures',
    description:
      'We feature varying, high-quality signature layouts designed for real inboxes with no broken HTML.',
  },
  {
    icon: BarChart3,
    title: 'Click and open analytics',
    description:
      'Track link clicks by type and optional opens when recipients load images—see which promos, logos, and CTAs actually get attention.',
  },
  {
    icon: Mail,
    title: 'Gmail + Outlook ready',
    description:
      'Copy your signature and paste into Gmail settings, or use the same HTML in Outlook and other clients.',
  },
  {
    icon: Users,
    title: 'Team-wide control',
    description:
      'Set brand, offers, and social links once. Every employee sends the same on-brand marketing footprint or let each customize.',
  },
] as const;

export function HomeFeatures() {
  return (
    <section className="container py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Features</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          A marketing channel in every send
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Tailnote combines on-brand email signatures with promotional blocks, measurable links, and
          optional open tracking—so every employee email promotes your business without extra tools.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {FEATURES.map(({ icon: Icon, title, description }, index) => (
          <RevealOnScroll key={title} delayMs={index * 60}>
            <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-ring">
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
