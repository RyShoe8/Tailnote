'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { capturePostHogEvent } from '@/components/analytics/PostHogProvider';
import { Button } from '@/components/ui/button';

export function EmailHealthTailnoteCta() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-8 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">Tailnote</p>
      <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground">
        Improve your outbound branding with Tailnote
      </h2>
      <p className="mt-3 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
        Turn every employee email into a branded channel — on-brand signatures, promotional blocks,
        and click tracking that work in Gmail and Outlook.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="gap-2 shadow-card">
          <Link
            href="/signup"
            onClick={() => capturePostHogEvent('email_health_cta_clicked', { target: 'signup' })}
          >
            Get started
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link
            href="/templates"
            onClick={() => capturePostHogEvent('email_health_cta_clicked', { target: 'templates' })}
          >
            View templates
          </Link>
        </Button>
      </div>
    </section>
  );
}
