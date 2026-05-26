import { ContactForm } from '@/components/marketing/ContactForm';
import { FloatingOrbs } from '@/components/marketing/FloatingOrbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { contactPageJsonLd, marketingBreadcrumbJsonLd } from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';

const contactPage = marketingPageByKey('contact');

export const metadata = createPageMetadata({
  title: contactPage.title,
  description: contactPage.description,
  path: contactPage.path,
});

export default function ContactPage() {
  return (
    <div className="relative isolate">
      <JsonLd
        data={[
          contactPageJsonLd({
            path: contactPage.path,
            name: contactPage.title,
            description: contactPage.description,
          }),
          marketingBreadcrumbJsonLd(contactPage.title, contactPage.path),
        ]}
      />
      <div
        aria-hidden
        className="tn-grad-bg-soft pointer-events-none absolute inset-x-0 -top-20 -z-10 h-[24rem]"
      />
      <FloatingOrbs
        orbs={[
          {
            size: 280,
            position: 'left-[-5rem] top-[-3rem]',
            background:
              'radial-gradient(circle at 30% 30%, rgba(12,143,163,0.28), rgba(12,143,163,0) 70%)',
            blur: 14,
            animationClass: 'tn-float-slow',
            opacity: 0.85,
          },
          {
            size: 220,
            position: 'right-[-3rem] top-[5rem]',
            background:
              'radial-gradient(circle at 70% 30%, rgba(79,214,178,0.30), rgba(79,214,178,0) 70%)',
            blur: 16,
            animationClass: 'tn-drift',
            delayClass: 'tn-float-delay-1',
            opacity: 0.85,
          },
        ]}
      />
      <div className="container relative py-14 sm:py-20">
        <div className="tn-rise mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Contact</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            We&apos;d love to <span className="tn-grad-text">hear from you</span>
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Questions about Tailnote, custom rollouts, or partnerships? Send us a note and we&apos;ll
            reply at the email you provide &mdash; usually within one business day.
          </p>
        </div>
        <div className="tn-rise mx-auto mt-10 max-w-xl rounded-2xl border border-slate-200/70 bg-white p-6 shadow-float ring-1 ring-black/5 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
