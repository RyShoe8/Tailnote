'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { TrustCenterDomainTable } from '@/components/brand-trust/trust-center/TrustCenterDomainTable';
import { TrustCenterPostScan } from '@/components/brand-trust/trust-center/TrustCenterPostScan';
import { TrustCenterPreScan } from '@/components/brand-trust/trust-center/TrustCenterPreScan';
import { TrustCenterScanAnother } from '@/components/brand-trust/trust-center/TrustCenterScanAnother';
import {
  buildTrustCenterPillars,
  type TrustCenterBimiState,
} from '@/lib/brandTrust/buildTrustCenterPillars';
import type { TrustCenterDomainRow } from '@/lib/brandTrust/orgBrandTrustScans';
import { TRUST_CENTER_NO_DOMAIN } from '@/lib/brandTrust/trustCenterCopy';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';

type Props = {
  orgDomain: string | null;
  initialScan: SerializedEmailHealthScan | null;
  initialDomains?: TrustCenterDomainRow[];
  canUseBimiLogoHosting: boolean;
  bimiLogoUrl?: string;
  bimiSuggestedRecord?: string;
};

type ScanResponse = {
  scan?: SerializedEmailHealthScan;
  error?: string;
};

function domainRowFromScan(
  scan: SerializedEmailHealthScan,
  bimi: TrustCenterBimiState,
): TrustCenterDomainRow {
  const pillars = buildTrustCenterPillars(scan, bimi);
  return {
    domain: scan.domain,
    domainSlug: scan.domainSlug,
    scannedAt:
      scan.scannedAt instanceof Date ? scan.scannedAt.toISOString() : new Date(scan.scannedAt).toISOString(),
    score: scan.score,
    pillars: {
      deliverability: pillars.find((p) => p.id === 'deliverability')!.status,
      security: pillars.find((p) => p.id === 'security')!.status,
      branding: pillars.find((p) => p.id === 'branding')!.status,
    },
  };
}

function upsertDomainRow(rows: TrustCenterDomainRow[], row: TrustCenterDomainRow): TrustCenterDomainRow[] {
  const without = rows.filter((r) => r.domain !== row.domain);
  return [row, ...without];
}

export function BrandTrustHubClient({
  orgDomain,
  initialScan,
  initialDomains = [],
  canUseBimiLogoHosting,
  bimiLogoUrl: initialLogoUrl = '',
  bimiSuggestedRecord: initialRecord = '',
}: Props) {
  const [scan, setScan] = useState<SerializedEmailHealthScan | null>(initialScan);
  const [domains, setDomains] = useState<TrustCenterDomainRow[]>(initialDomains);
  const [scanCache, setScanCache] = useState<Record<string, SerializedEmailHealthScan>>(() => {
    if (!initialScan) return {};
    return { [initialScan.domain]: initialScan };
  });
  const [selectedDomain, setSelectedDomain] = useState<string | null>(initialScan?.domain ?? null);
  const [bimiLogoUrl, setBimiLogoUrl] = useState(initialLogoUrl);
  const [bimiSuggestedRecord, setBimiSuggestedRecord] = useState(initialRecord);
  const [rescanningDomain, setRescanningDomain] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  const bimiForDomain = useCallback(
    (domain: string): TrustCenterBimiState => {
      const isOrgDomain =
        orgDomain && domain.toLowerCase() === orgDomain.toLowerCase();
      return {
        canUseBimiLogoHosting,
        bimiLogoUrl: isOrgDomain ? bimiLogoUrl : '',
        bimiSuggestedRecord: isOrgDomain ? bimiSuggestedRecord : '',
      };
    },
    [orgDomain, canUseBimiLogoHosting, bimiLogoUrl, bimiSuggestedRecord],
  );

  const activeBimi = useMemo(
    () => (scan ? bimiForDomain(scan.domain) : bimiForDomain(orgDomain ?? '')),
    [scan, bimiForDomain, orgDomain],
  );

  const runScan = useCallback(
    async (domain: string, force = false) => {
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
      const serialized = {
        ...data.scan,
        scannedAt: new Date(data.scan.scannedAt),
      };
      const bimi = bimiForDomain(serialized.domain);
      const row = domainRowFromScan(serialized, bimi);

      setScanCache((prev) => ({ ...prev, [serialized.domain]: serialized }));
      setScan(serialized);
      setSelectedDomain(serialized.domain);
      setDomains((prev) => upsertDomainRow(prev, row));

      return serialized;
    },
    [bimiForDomain],
  );

  const handleScan = useCallback(
    async (domain: string) => {
      await runScan(domain, false);
    },
    [runScan],
  );

  const handleRescanDomain = useCallback(
    async (domain: string) => {
      setRescanningDomain(domain);
      try {
        await runScan(domain, true);
      } finally {
        setRescanningDomain(null);
      }
    },
    [runScan],
  );

  const handleRescan = useCallback(async () => {
    if (!scan?.domain) return;
    await handleRescanDomain(scan.domain);
  }, [handleRescanDomain, scan?.domain]);

  const handleSelectDomain = useCallback(
    async (domain: string) => {
      if (domain === selectedDomain && scan?.domain === domain) return;
      setSelectedDomain(domain);

      const cached = scanCache[domain];
      if (cached) {
        setScan(cached);
        return;
      }

      setSwitching(true);
      try {
        await runScan(domain, false);
      } finally {
        setSwitching(false);
      }
    },
    [selectedDomain, scan?.domain, scanCache, runScan],
  );

  const handleBimiUploaded = useCallback(
    ({ url, suggestedRecord }: { url: string; suggestedRecord: string }) => {
      setBimiLogoUrl(url);
      setBimiSuggestedRecord(suggestedRecord);
      if (scan && orgDomain && scan.domain.toLowerCase() === orgDomain.toLowerCase()) {
        const bimi = {
          canUseBimiLogoHosting,
          bimiLogoUrl: url,
          bimiSuggestedRecord: suggestedRecord,
        };
        const row = domainRowFromScan(scan, bimi);
        setDomains((prev) => upsertDomainRow(prev, row));
      }
    },
    [scan, orgDomain, canUseBimiLogoHosting],
  );

  const showResults = Boolean(scan) || domains.length > 0;

  if (!showResults) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {!orgDomain ? (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{TRUST_CENTER_NO_DOMAIN.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {TRUST_CENTER_NO_DOMAIN.beforeLink}
              <Link href="/dashboard/signature?tab=brand" className="text-primary underline">
                {TRUST_CENTER_NO_DOMAIN.signatureLinkLabel}
              </Link>
              {TRUST_CENTER_NO_DOMAIN.afterLink}
            </p>
          </div>
        ) : (
          <h1 className="sr-only">Brand Trust Center</h1>
        )}
        <TrustCenterPreScan initialDomain={orgDomain ?? ''} onScan={handleScan} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <h1 className="sr-only">Brand Trust Center</h1>

      {scan ? (
        <TrustCenterPostScan
          scan={scan}
          bimi={activeBimi}
          rescanning={rescanningDomain !== null || switching}
          onRescan={() => void handleRescan()}
          onBimiUploaded={handleBimiUploaded}
        />
      ) : null}

      <TrustCenterDomainTable
        domains={domains}
        selectedDomain={selectedDomain}
        rescanningDomain={rescanningDomain}
        onSelect={(domain) => void handleSelectDomain(domain)}
        onRescan={(domain) => void handleRescanDomain(domain)}
      />

      <TrustCenterScanAnother onScan={handleScan} defaultDomain="" />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/email-health" className="text-primary underline">
          Public email health checker
        </Link>
      </p>
    </div>
  );
}
