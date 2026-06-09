'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BimiLogoUpload } from '@/components/brand-trust/BimiLogoUpload';
import { BimiReadinessPanel } from '@/components/email-health/BimiReadinessPanel';
import { EmailHealthScoreRing } from '@/components/email-health/EmailHealthScoreRing';
import { DomainScanForm } from '@/components/email-health/DomainScanForm';
import { SIGNATURE_VS_INBOX_LOGO } from '@/lib/email-health/bimiCopy';
import type { BIMIResult } from '@/lib/email-health/bimiTypes';
import { vmcStatusFromResult } from '@/lib/email-health/bimiTypes';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';
import type { CategoryResult, CheckStatus } from '@/lib/email-health/types';
import { Button } from '@/components/ui/button';

function catStatus(categories: CategoryResult[], id: string): CheckStatus | 'unknown' {
  const row = categories.find((c) => c.category === id);
  if (!row) return 'unknown';
  return row.status;
}

function statusIcon(status: CheckStatus | 'unknown') {
  if (status === 'pass') return '✓';
  if (status === 'warn') return '!';
  if (status === 'fail') return '✗';
  return '?';
}

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
  const bimi: BIMIResult | undefined = scan?.bimiDetail;

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

  const vmc = bimi ? vmcStatusFromResult(bimi) : 'unknown';

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
        <div className="grid gap-8 lg:grid-cols-[minmax(0,240px)_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <EmailHealthScoreRing score={scan.score} statusLabel={scan.statusLabel} />
            <p className="mt-3 text-center text-xs text-muted-foreground">Trust score</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Domain health
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ['SPF', catStatus(scan.categories, 'spf')],
                ['DKIM', catStatus(scan.categories, 'dkim')],
                ['DMARC', catStatus(scan.categories, 'dmarc')],
                ['BIMI', bimi?.status ?? catStatus(scan.categories, 'bimi')],
                ['VMC', vmc],
              ].map(([label, st]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span>{label}</span>
                  <span className="font-semibold">{statusIcon(st as CheckStatus | 'unknown')}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/brand-trust/${scan.domainSlug}#dmarc`}>Fix DMARC</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/brand-trust/${scan.domainSlug}#bimi`}>Get BIMI ready</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {bimi ? (
        <div id="bimi">
          <BimiReadinessPanel bimi={bimi} showPaidCta={!canUseBimiLogoHosting} />
        </div>
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
