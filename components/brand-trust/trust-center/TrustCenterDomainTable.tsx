'use client';

import { Check, Loader2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TrustCenterDomainRow, TrustCenterPillarStatus } from '@/lib/brandTrust/orgBrandTrustScans';
import type { TrustCenterPillarId } from '@/lib/brandTrust/trustCenterCopy';

const PILLAR_COLUMNS: { id: TrustCenterPillarId; label: string; short: string }[] = [
  { id: 'deliverability', label: 'Inbox delivery', short: 'Inbox' },
  { id: 'security', label: 'Anti-spoofing', short: 'Security' },
  { id: 'branding', label: 'Inbox logo', short: 'Logo' },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return iso;
  }
}

function PillarStatusCell({ status, label }: { status: TrustCenterPillarStatus; label: string }) {
  const ok = status === 'confirmed';
  return (
    <td className="p-3 text-center">
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
          ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}
        title={ok ? `${label}: looking good` : `${label}: needs attention`}
        aria-label={ok ? `${label}: looking good` : `${label}: needs attention`}
      >
        {ok ? <Check className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
      </span>
    </td>
  );
}

type Props = {
  domains: TrustCenterDomainRow[];
  selectedDomain: string | null;
  rescanningDomain: string | null;
  onSelect: (domain: string) => void;
  onRescan: (domain: string) => void;
};

export function TrustCenterDomainTable({
  domains,
  selectedDomain,
  rescanningDomain,
  onSelect,
  onRescan,
}: Props) {
  if (domains.length === 0) return null;

  const rescanBusy = rescanningDomain !== null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-foreground">Your scanned domains</h2>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="min-w-0 overflow-x-auto rounded-2xl border border-slate-200/80 shadow-card">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="p-3 font-medium">Domain</th>
                {PILLAR_COLUMNS.map((col) => (
                  <th key={col.id} className="p-3 text-center font-medium">
                    <span className="hidden sm:inline">{col.label}</span>
                    <span className="sm:hidden">{col.short}</span>
                  </th>
                ))}
                <th className="p-3 font-medium">Scanned</th>
                <th className="p-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {domains.map((row) => {
                const selected = row.domain === selectedDomain;
                const rowRescanning = rescanningDomain === row.domain;
                return (
                  <tr
                    key={row.domain}
                    className={`border-b last:border-0 transition-colors ${
                      selected ? 'border-l-2 border-l-primary bg-primary/5' : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <td className="p-3">
                      <button
                        type="button"
                        className="w-full text-left font-medium text-foreground hover:underline"
                        onClick={() => onSelect(row.domain)}
                        aria-pressed={selected}
                      >
                        {row.domain}
                      </button>
                    </td>
                    {PILLAR_COLUMNS.map((col) => (
                      <PillarStatusCell
                        key={col.id}
                        status={row.pillars[col.id]}
                        label={col.label}
                      />
                    ))}
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(row.scannedAt)}
                    </td>
                    <td className="p-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 shrink-0"
                        disabled={rescanBusy}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRescan(row.domain);
                        }}
                        aria-label={`Rescan ${row.domain}`}
                      >
                        {rowRescanning ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                        )}
                        Rescan
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
