'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  rescanning: boolean;
  onRescan: () => void;
  onBimiUploaded?: (payload: { url: string; suggestedRecord: string }) => void;
};

export function TrustCenterPostScan({
  scan,
  bimi,
  rescanning,
  onRescan,
  onBimiUploaded,
}: Props) {
  const pillars = buildTrustCenterPillars(scan, bimi);
  const summary = buildTrustCenterSummary(pillars);

  const ordered = TRUST_CENTER_PILLAR_ORDER.map((id) =>
    pillars.find((p) => p.id === id),
  ).filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
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

      <div className="space-y-5">
        {ordered.map((pillar) => (
          <TrustCenterPillarCard
            key={pillar.id}
            pillar={pillar}
            domain={scan.domain}
            canUseBimiLogoHosting={bimi.canUseBimiLogoHosting}
            bimiLogoUrl={bimi.bimiLogoUrl}
            bimiSuggestedRecord={bimi.bimiSuggestedRecord}
            onBimiUploaded={onBimiUploaded}
          />
        ))}
      </div>
    </div>
  );
}
