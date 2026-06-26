import { JsonLd } from '@/components/seo/JsonLd';
import { BrandTrustHubClient } from '@/components/brand-trust/BrandTrustHubClient';
import { EmailHealthSeoHero } from '@/components/email-health/EmailHealthSeoHero';
import { CATEGORY_GUIDE } from '@/lib/email-health/categoryGuide';
import { EMAIL_HEALTH_FAQS } from '@/lib/email-health/faqs';
import {
  EMAIL_HEALTH_CHECKER_SECTIONS,
  EMAIL_HEALTH_DELIVERABILITY_AUDIT,
  EMAIL_HEALTH_FEATURE_CARDS,
  EMAIL_HEALTH_PAGE_DESCRIPTION,
  EMAIL_HEALTH_PAGE_TITLE,
} from '@/lib/email-health/seoCopy';
import type { EmailHealthCategory } from '@/lib/email-health/types';
import {
  emailHealthChecksItemListJsonLd,
  emailHealthWebApplicationJsonLd,
  faqPageJsonLd,
  marketingBreadcrumbJsonLd,
  webPageJsonLd,
} from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';

const emailHealthPage = marketingPageByKey('emailHealth');

const SCORE_CATEGORY_ORDER: EmailHealthCategory[] = [
  'spf',
  'dkim',
  'dmarc',
  'bimi',
  'mx',
  'tls',
  'https',
];

export const metadata = createPageMetadata({
  title: EMAIL_HEALTH_PAGE_TITLE,
  description: EMAIL_HEALTH_PAGE_DESCRIPTION,
  path: emailHealthPage.path,
});

export default function EmailHealthLandingPage() {
  return (
    <div className="relative isolate bg-white">
      <JsonLd
        data={[
          webPageJsonLd({
            path: emailHealthPage.path,
            name: EMAIL_HEALTH_PAGE_TITLE,
            description: EMAIL_HEALTH_PAGE_DESCRIPTION,
          }),
          marketingBreadcrumbJsonLd('Email Health', emailHealthPage.path),
          emailHealthWebApplicationJsonLd(),
          emailHealthChecksItemListJsonLd(),
          faqPageJsonLd(EMAIL_HEALTH_FAQS),
        ]}
      />
      <div className="container relative py-16 sm:py-24 lg:py-28">
        <EmailHealthSeoHero />

        <div className="mt-10">
          <BrandTrustHubClient
            variant="public"
            navigateOnScan
            suppressPreScanHeading
          />
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          {EMAIL_HEALTH_FEATURE_CARDS.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200/70 bg-white p-5 text-left shadow-card"
            >
              <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>

        <section className="mx-auto mt-20 max-w-4xl" aria-labelledby="checker-sections-heading">
          <h2
            id="checker-sections-heading"
            className="text-center text-xl font-semibold tracking-tight"
          >
            Free SPF, DKIM, DMARC &amp; BIMI checkers
          </h2>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Each checker validates live DNS and configuration for your domain — no account required.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {EMAIL_HEALTH_CHECKER_SECTIONS.map((section) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-xl border border-slate-200/70 bg-white p-5 shadow-card"
              >
                <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{section.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="mx-auto mt-20 max-w-3xl"
          aria-labelledby="deliverability-audit-heading"
        >
          <h2
            id="deliverability-audit-heading"
            className="text-center text-xl font-semibold tracking-tight"
          >
            {EMAIL_HEALTH_DELIVERABILITY_AUDIT.heading}
          </h2>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            {EMAIL_HEALTH_DELIVERABILITY_AUDIT.intro}
          </p>
        </section>

        <section className="mx-auto mt-20 max-w-3xl" aria-labelledby="score-breakdown-heading">
          <h2
            id="score-breakdown-heading"
            className="text-center text-xl font-semibold tracking-tight"
          >
            {EMAIL_HEALTH_DELIVERABILITY_AUDIT.scoreSectionHeading}
          </h2>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            {EMAIL_HEALTH_DELIVERABILITY_AUDIT.scoreSectionIntro}
          </p>
          <ul className="mt-8 space-y-4">
            {SCORE_CATEGORY_ORDER.map((key) => {
              const guide = CATEGORY_GUIDE[key];
              return (
                <li
                  key={key}
                  className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-card sm:flex sm:items-start sm:gap-4"
                >
                  <div className="flex shrink-0 items-center gap-2 sm:w-36 sm:flex-col sm:items-start">
                    <span className="text-sm font-semibold text-foreground">{guide.label}</span>
                    <span className="text-xs font-medium text-primary">{guide.maxPoints} pts</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground sm:mt-0">{guide.whatItChecks}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mx-auto mt-20 max-w-2xl">
          <h2 className="text-center text-xl font-semibold tracking-tight">Common questions</h2>
          <dl className="mt-8 space-y-6">
            {EMAIL_HEALTH_FAQS.map((item) => (
              <div key={item.q}>
                <dt className="font-medium text-foreground">{item.q}</dt>
                <dd className="mt-2 text-sm text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
