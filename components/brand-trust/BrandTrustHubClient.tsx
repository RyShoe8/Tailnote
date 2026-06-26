'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { TrustCenterPostScan } from '@/components/brand-trust/trust-center/TrustCenterPostScan';
import { TrustCenterPreScan } from '@/components/brand-trust/trust-center/TrustCenterPreScan';
import type { TrustCenterBimiState } from '@/lib/brandTrust/buildTrustCenterPillars';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';

type Props = {
  orgDomain: string | null;
  initialScan: SerializedEmailHealthScan | null;
  canUseBimiLogoHosting: boolean;
  bimiLogoUrl?: string;
  bimiSuggestedRecord?: string;
};

type ScanResponse = {
  scan?: SerializedEmailHealthScan;
  error?: string;
};

export function BrandTrustHubClient({
  orgDomain,
  initialScan,
  canUseBimiLogoHosting,
  bimiLogoUrl: initialLogoUrl = '',
  bimiSuggestedRecord: initialRecord = '',
}: Props) {
  const [scan, setScan] = useState<SerializedEmailHealthScan | null>(initialScan);
  const [bimiLogoUrl, setBimiLogoUrl] = useState(initialLogoUrl);
  const [bimiSuggestedRecord, setBimiSuggestedRecord] = useState(initialRecord);
  const [rescanning, setRescanning] = useState(false);

  const bimi: TrustCenterBimiState = {
    canUseBimiLogoHosting,
    bimiLogoUrl,
    bimiSuggestedRecord,
  };

  const runScan = useCallback(async (domain: string, force = false) => {
    const res = await fetch('/api/dashboard/brand-trust/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, force }),
      credentials: 'include',
    });
    const data = (await res.json()) as ScanResponse;
    if (!res.ok || !data.scan) {
      throw new Error(data.error ?? 'Scan failed');
    }
    setScan({
      ...data.scan,
      scannedAt: new Date(data.scan.scannedAt),
    });
  }, []);

  const handleScan = useCallback(
    async (domain: string) => {
      await runScan(domain, false);
    },
    [runScan],
  );

  const handleRescan = useCallback(async () => {
    if (!scan?.domain) return;
    setRescanning(true);
    try {
      await runScan(scan.domain, true);
    } finally {
      setRescanning(false);
    }
  }, [runScan, scan?.domain]);

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
        <TrustCenterPreScan onScan={handleScan} />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="space-y-6">
        <h1 className="sr-only">Brand Trust Center</h1>
        <TrustCenterPreScan initialDomain={orgDomain} onScan={handleScan} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Brand Trust Center</h1>
      <TrustCenterPostScan
        scan={scan}
        bimi={bimi}
        rescanning={rescanning}
        onRescan={() => void handleRescan()}
        onBimiUploaded={({ url, suggestedRecord }) => {
          setBimiLogoUrl(url);
          setBimiSuggestedRecord(suggestedRecord);
        }}
      />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/email-health" className="text-primary underline">
          Public email health checker
        </Link>
      </p>
    </div>
  );
}
