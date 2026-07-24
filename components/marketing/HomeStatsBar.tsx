import { RevealOnScroll } from '@/components/marketing/RevealOnScroll';

const STATS = [
  { value: '6', label: 'Promo block types', detail: 'book-a-call, offers, banners & more' },
  { value: '$0', label: 'Free plan', detail: 'core signatures included' },
  { value: '100%', label: 'On-brand', detail: 'every signature, every send' },
  { value: '<2 min', label: 'Setup time', detail: 'copy, paste, done' },
] as const;

export function HomeStatsBar() {
  return (
    <section className="tn-grad-stats relative overflow-hidden py-16 sm:py-20">
      {/* Decorative elements */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -right-20 top-1/3 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl" />
      </div>
      <div className="container">
        <RevealOnScroll>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
            {STATS.map((stat, i) => (
              <RevealOnScroll key={stat.label} delayMs={i * 100}>
                <div className="text-center">
                  <div className="tn-stat-number text-4xl font-bold tracking-tight sm:text-5xl">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white sm:text-base">
                    {stat.label}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 sm:text-sm">
                    {stat.detail}
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
