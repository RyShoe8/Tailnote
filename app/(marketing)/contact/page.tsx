import { ContactForm } from '@/components/marketing/ContactForm';

export const metadata = {
  title: 'Contact us — Tailnote',
  description:
    'Get in touch with the Tailnote team. We reply at the email you provide — usually within one business day.',
};

export default function ContactPage() {
  return (
    <div className="relative isolate">
      <div
        aria-hidden
        className="tn-grad-bg-soft pointer-events-none absolute inset-x-0 -top-20 -z-10 h-[24rem]"
      />
      <div className="container py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Contact</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            We&apos;d love to <span className="tn-grad-text">hear from you</span>
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Questions about Tailnote, custom rollouts, or partnerships? Send us a note and we&apos;ll
            reply at the email you provide &mdash; usually within one business day.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
