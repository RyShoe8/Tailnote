'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BimiCurrentLogoPanel } from '@/components/brand-trust/BimiCurrentLogoPanel';
import { BimiLogoUpload } from '@/components/brand-trust/BimiLogoUpload';
import { TrustCenterPillarCard } from '@/components/brand-trust/trust-center/TrustCenterPillarCard';
import {
  TRUST_CENTER_PILLAR_ORDER,
  buildTrustCenterPillars,
  buildTrustCenterSummary,
  type TrustCenterBimiState,
} from '@/lib/brandTrust/buildTrustCenterPillars';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';

type Props = {
  scan: SerializedEmailHealthScan;
  bimi: TrustCenterBimiState;
  bimiLogoUploadedAt?: string | null;
  rescanning: boolean;
  onRescan: () => void;
  onBimiUploaded?: (payload: { url: string; suggestedRecord: string; uploadedAt: string }) => void;
  onRescanAfterUpload?: () => void;
  showLogoManagement?: boolean;
  upgradeHref?: string;
};

export function TrustCenterPostScan({
  scan,
  bimi,
  bimiLogoUploadedAt = null,
  rescanning,
  onRescan,
  onBimiUploaded,
  onRescanAfterUpload,
  showLogoManagement = false,
  upgradeHref,
}: Props) {
  const pillars = buildTrustCenterPillars(scan, bimi);
  const summary = buildTrustCenterSummary(pillars);

  const ordered = TRUST_CENTER_PILLAR_ORDER.map((id) =>
    pillars.find((p) => p.id === id),
  ).filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{scan.domain}</h2>
        <p className="text-sm text-muted-foreground">Scan results</p>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-lg font-medium text-foreground">{summary}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRescan}
          disabled={rescanning}
          className="gap-2 shrink-0"
        >
          {rescanning ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden />
          )}
          Rescan
        </Button>
      </div>

      {showLogoManagement && bimi.bimiLogoUrl.trim() ? (
        <div className="space-y-4">
          <BimiCurrentLogoPanel
            bimiLogoUrl={bimi.bimiLogoUrl}
            bimiLogoUploadedAt={bimiLogoUploadedAt}
            bimiDetail={scan.bimiDetail}
          />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Replace inbox logo</h3>
            <BimiLogoUpload
              canUseBimiLogoHosting={bimi.canUseBimiLogoHosting}
              bimiLogoUrl={bimi.bimiLogoUrl}
              bimiLogoUploadedAt={bimiLogoUploadedAt}
              bimiSuggestedRecord={bimi.bimiSuggestedRecord}
              hidePreview
              hideTitle
              upgradeHref={upgradeHref}
              onUploaded={onBimiUploaded}
              onRescanRequested={onRescanAfterUpload}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-5" key={scan.domain}>
        {ordered.map((pillar) => (
          <TrustCenterPillarCard
            key={`${scan.domain}-${pillar.id}`}
            pillar={pillar}
            domain={scan.domain}
            canUseBimiLogoHosting={bimi.canUseBimiLogoHosting}
            bimiLogoUrl={bimi.bimiLogoUrl}
            bimiSuggestedRecord={bimi.bimiSuggestedRecord}
            bimiLogoUploadedAt={bimiLogoUploadedAt}
            onBimiUploaded={onBimiUploaded}
            upgradeHref={upgradeHref}
          />
        ))}
      </div>
    </div>
  );
}
