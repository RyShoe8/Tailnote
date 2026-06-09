'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BimiLogoUpload } from '@/components/brand-trust/BimiLogoUpload';
import { BimiReportEducation } from '@/components/email-health/BimiReportEducation';
import { CategoryBreakdown } from '@/components/email-health/CategoryBreakdown';
import { DomainScanForm } from '@/components/email-health/DomainScanForm';
import { EmailHealthProblemsSection } from '@/components/email-health/EmailHealthProblemsSection';
import { EmailHealthScoreRing } from '@/components/email-health/EmailHealthScoreRing';
import { ScoreGuide } from '@/components/email-health/ScoreGuide';
import { buildStepsByCategory } from '@/lib/email-health/categoryGuide';
import { SIGNATURE_VS_INBOX_LOGO } from '@/lib/email-health/bimiCopy';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';
import { Button } from '@/components/ui/button';

type Props = {
  orgDomain: string | null;
  scan: SerializedEmailHealthScan | null;
  canUseBimiLogoHosting: boolean;
  bimiLogoUrl?: string;
  bimiSuggestedRecord?: string;
};

export function BrandTrustHubClient({
  orgDomain,
  scan,
  canUseBimiLogoHosting,
  bimiLogoUrl,
  bimiSuggestedRecord,
}: Props) {
  const router = useRouter();
  const [rescanning, setRescanning] = useState(false);

  async function rescan() {
    if (!orgDomain) return;
    setRescanning(true);
    try {
      await fetch('/api/dashboard/brand-trust/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: orgDomain, force: true }),
        credentials: 'include',
      });
      router.refresh();
    } finally {
      setRescanning(false);
    }
  }

  if (!orgDomain) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brand Trust Center</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your company website on the{' '}
            <Link href="/dashboard/signature?tab=brand" className="text-primary underline">
              Signature
            </Link>{' '}
            tab so we can check your domain. Or scan any domain below.
          </p>
        </div>
        <DomainScanForm size="large" resultBasePath="/dashboard/brand-trust" />
      </div>
    );
  }

  const stepsByCategory = scan ? buildStepsByCategory(scan.issues) : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brand Trust Center</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Do people actually trust emails from {orgDomain}? Check authentication, BIMI readiness, and
            next steps in plain English.
          </p>
        </div>
        <Button type="button" variant="outline" disabled={rescanning} onClick={() => void rescan()}>
          {rescanning ? 'Rescanning…' : 'Rescan domain'}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{SIGNATURE_VS_INBOX_LOGO}</p>

      {scan ? (
        <>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,240px)_1fr] lg:items-start">
            <div className="rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
              <EmailHealthScoreRing score={scan.score} statusLabel={scan.statusLabel} />
              <p className="mt-3 text-center text-xs text-muted-foreground">Trust score</p>
            </div>
            <div className="min-w-0 space-y-8">
              <ScoreGuide statusLabel={scan.statusLabel} />

              <section>
                <h2 className="text-lg font-semibold tracking-tight">Category breakdown</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each row shows what we measured, your points, and how to earn full credit when not passing.
                </p>
                <div className="mt-4">
                  <CategoryBreakdown
                    categories={scan.categories}
                    stepsByCategory={stepsByCategory}
                    bimiDetail={scan.bimiDetail}
                  />
                </div>
              </section>
            </div>
          </div>

          <EmailHealthProblemsSection
            issues={scan.issues}
            showPricingLink={!canUseBimiLogoHosting}
          />

          {scan.bimiDetail ? <BimiReportEducation bimi={scan.bimiDetail} /> : null}

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/brand-trust/${scan.domainSlug}#dmarc`}>Full report: DMARC</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/brand-trust/${scan.domainSlug}#bimi`}>Full report: BIMI</Link>
            </Button>
          </div>
        </>
      ) : null}

      <BimiLogoUpload
        canUseBimiLogoHosting={canUseBimiLogoHosting}
        bimiLogoUrl={bimiLogoUrl}
        bimiSuggestedRecord={bimiSuggestedRecord}
      />

      <div className="text-sm text-muted-foreground">
        <Link href={`/dashboard/brand-trust/${scan?.domainSlug ?? ''}`} className="text-primary underline">
          Full domain report
        </Link>
        {' · '}
        <Link href="/email-health" className="text-primary underline">
          Public email health checker
        </Link>
      </div>
    </div>
  );
}
