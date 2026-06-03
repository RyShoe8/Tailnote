'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { capturePostHogEvent } from '@/components/analytics/PostHogProvider';
import { Button } from '@/components/ui/button';

type BlogTailnoteCtaProps = {
  variant?: 'signatures' | 'team' | 'email-health';
};

const CTA_COPY = {
  signatures: {
    title: 'Try Tailnote to turn every employee email into a branded touchpoint.',
    body: 'Build consistent signatures for your team with signature layouts, promotional blocks, and one-click install for Gmail and Outlook.',
    primary: { href: '/signup', label: 'Get started free' },
    secondary: { href: '/signatures', label: 'Browse signatures' },
  },
  team: {
    title: 'Build consistent signatures for your team.',
    body: 'Roll out on-brand signatures across your organization — update once, deploy everywhere.',
    primary: { href: '/signup', label: 'Start free trial' },
    secondary: { href: '/pricing', label: 'View pricing' },
  },
  'email-health': {
    title: 'Check your domain email health with Tailnote.',
    body: 'Run a free SPF, DKIM, and DMARC check — then fix deliverability issues before they hurt your inbox placement.',
    primary: { href: '/email-health', label: 'Check email health' },
    secondary: { href: '/signup', label: 'Get started' },
  },
} as const;

export function BlogTailnoteCta({ variant = 'signatures' }: BlogTailnoteCtaProps) {
  const copy = CTA_COPY[variant];

  return (
    <section className="my-10 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-6 shadow-card not-prose sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">Tailnote</p>
      <h3 className="mt-2 text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {copy.title}
      </h3>
      <p className="mt-3 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
        {copy.body}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="gap-2 shadow-card">
          <Link
            href={copy.primary.href}
            onClick={() =>
              capturePostHogEvent('blog_cta_clicked', { variant, target: copy.primary.href })
            }
          >
            {copy.primary.label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link
            href={copy.secondary.href}
            onClick={() =>
              capturePostHogEvent('blog_cta_clicked', { variant, target: copy.secondary.href })
            }
          >
            {copy.secondary.label}
          </Link>
        </Button>
      </div>
    </section>
  );
}
