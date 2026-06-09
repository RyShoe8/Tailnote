'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BimiLogoUpload } from '@/components/brand-trust/BimiLogoUpload';
import { BimiReadinessPanel } from '@/components/email-health/BimiReadinessPanel';
import { SIGNATURE_VS_INBOX_LOGO } from '@/lib/email-health/bimiCopy';
import type { BIMIResult } from '@/lib/email-health/bimiTypes';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';

type BrandTrustPayload = {
  orgDomain: string | null;
  scan: SerializedEmailHealthScan | null;
  bimiLogoUrl?: string;
  bimiSuggestedRecord?: string;
  entitlements: { canUseBimiLogoHosting: boolean };
};

export function SignatureBimiTab() {
  const [data, setData] = useState<BrandTrustPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/dashboard/brand-trust', { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof json.error === 'string' ? json.error : 'Could not load BIMI status');
          return;
        }
        setData(json as BrandTrustPayload);
      } catch {
        setError('Could not load BIMI status');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading brand logo status…</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!data?.orgDomain) {
    return (
      <CardShell>
        <p className="text-sm text-muted-foreground">
          Add your company website on the Brand tab so we can check BIMI readiness for your domain.
        </p>
        <Link href="/dashboard/brand-trust" className="text-sm font-medium text-primary underline">
          Open Brand Trust Center
        </Link>
      </CardShell>
    );
  }

  const bimi: BIMIResult | undefined = data.scan?.bimiDetail;

  return (
    <div className="space-y-6">
      <CardShell>
        <p className="text-sm text-muted-foreground">{SIGNATURE_VS_INBOX_LOGO}</p>
        <p className="mt-2 text-sm">
          Checking domain: <span className="font-medium">{data.orgDomain}</span>
        </p>
        <Link href="/dashboard/brand-trust" className="mt-2 inline-block text-sm font-medium text-primary underline">
          Full Brand Trust Center
        </Link>
      </CardShell>

      {bimi ? (
        <BimiReadinessPanel
          bimi={bimi}
          compact
          showPaidCta={!data.entitlements.canUseBimiLogoHosting}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Run a scan from the{' '}
          <Link href="/dashboard/brand-trust" className="text-primary underline">
            Brand Trust Center
          </Link>{' '}
          to see BIMI checks.
        </p>
      )}

      <BimiLogoUpload
        canUseBimiLogoHosting={data.entitlements.canUseBimiLogoHosting}
        bimiLogoUrl={data.bimiLogoUrl}
        bimiSuggestedRecord={data.bimiSuggestedRecord}
      />
    </div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">{children}</div>
  );
}
