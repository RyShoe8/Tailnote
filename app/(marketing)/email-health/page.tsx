import { JsonLd } from '@/components/seo/JsonLd';
import { EmailHealthHero } from '@/components/email-health/EmailHealthHero';
import { CATEGORY_GUIDE } from '@/lib/email-health/categoryGuide';
import { EMAIL_HEALTH_FAQS } from '@/lib/email-health/faqs';
import type { EmailHealthCategory } from '@/lib/email-health/types';
import { faqPageJsonLd, webPageJsonLd } from '@/lib/seo/jsonLd';
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
  title: emailHealthPage.title,
  description: emailHealthPage.description,
  path: emailHealthPage.path,
});

export default function EmailHealthLandingPage() {
  return (
    <div className="relative isolate bg-white">
      <JsonLd
        data={[
          webPageJsonLd({
            path: emailHealthPage.path,
            name: emailHealthPage.title,
            description: emailHealthPage.description,
          }),
          faqPageJsonLd(EMAIL_HEALTH_FAQS),
        ]}
      />
      <div className="container relative py-16 sm:py-24 lg:py-28">
        <EmailHealthHero />

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          {[
            {
              title: 'Trust score',
              body: 'A single 0–100 score with clear status levels so you know where you stand.',
            },
            {
              title: 'Actionable fixes',
              body: 'Business-friendly explanations plus DNS records you can copy to your provider.',
            },
            {
              title: 'Built for teams',
              body: 'Understand deliverability basics without MXToolbox-style complexity.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200/70 bg-white p-5 text-left shadow-card"
            >
              <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>

        <section className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-center text-xl font-semibold tracking-tight">What&apos;s in your score?</h2>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Your report adds up to 100 points across seven checks. Pass earns full credit; warn earns partial;
            fail earns none. Every warn includes step-by-step instructions to reach a pass.
          </p>
          <ul className="mt-8 space-y-4">
            {SCORE_CATEGORY_ORDER.map((key) => {
              const guide = CATEGORY_GUIDE[key];
              return (
                <li
                  key={key}
                  className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-card sm:flex sm:gap-4 sm:items-start"
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
