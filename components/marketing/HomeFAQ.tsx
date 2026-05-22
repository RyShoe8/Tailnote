import { Plus } from 'lucide-react';
import { HOME_FAQS } from '@/lib/seo/homeFaq';

export function HomeFAQ() {
  return (
    <section className="container py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Questions</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200/80 bg-white shadow-card">
          {HOME_FAQS.map((item, idx) => (
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
