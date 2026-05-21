import type { ReactNode } from 'react';
import type { LegalSection } from '@/lib/marketing/legalContent';

type MarketingDocPageProps = {
  title: string;
  lastUpdated?: string;
  intro?: string;
  sections?: LegalSection[];
  children?: ReactNode;
};

function LegalSectionBlock({ section }: { section: LegalSection }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {section.title}
      </h2>
      {section.paragraphs?.map((paragraph, index) => (
        <p key={index} className="text-base leading-relaxed text-muted-foreground">
          {paragraph}
        </p>
      ))}
      {section.listItems && section.listItems.length > 0 && (
        <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-muted-foreground">
          {section.listItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function MarketingDocPage({
  title,
  lastUpdated,
  intro,
  sections,
  children,
}: MarketingDocPageProps) {
  return (
    <div className="relative isolate">
      <div
        aria-hidden
        className="tn-grad-bg-soft pointer-events-none absolute inset-x-0 -top-20 -z-10 h-72"
      />
      <article className="container py-14 sm:py-20">
        <div className="mx-auto min-w-0 max-w-3xl">
          <header className="space-y-4">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            <div
              aria-hidden
              className="h-1 w-24 rounded-full tn-grad-bg"
            />
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
            )}
            {intro && (
              <p className="text-pretty text-lg leading-relaxed text-muted-foreground">{intro}</p>
            )}
          </header>
          <div className="mt-12 space-y-10">
            {sections?.map((section) => (
              <LegalSectionBlock key={section.title} section={section} />
            ))}
            {children}
          </div>
        </div>
      </article>
    </div>
  );
}
