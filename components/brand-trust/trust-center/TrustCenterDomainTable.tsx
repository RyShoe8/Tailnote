'use client';

import { Check, X } from 'lucide-react';
import type { TrustCenterDomainRow, TrustCenterPillarStatus } from '@/lib/brandTrust/orgBrandTrustScans';
import type { TrustCenterPillarId } from '@/lib/brandTrust/trustCenterCopy';

const PILLAR_COLUMNS: { id: TrustCenterPillarId; label: string; short: string }[] = [
  { id: 'deliverability', label: 'Inbox delivery', short: 'Inbox' },
  { id: 'security', label: 'Anti-spoofing', short: 'Security' },
  { id: 'branding', label: 'Inbox logo', short: 'Logo' },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
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
  onSelect: (domain: string) => void;
};

export function TrustCenterDomainTable({ domains, selectedDomain, onSelect }: Props) {
  if (domains.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-foreground">Your scanned domains</h2>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="min-w-0 overflow-x-auto rounded-xl border shadow-card">
          <table className="w-full min-w-[32rem] text-sm">
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
              </tr>
            </thead>
            <tbody>
              {domains.map((row) => {
                const selected = row.domain === selectedDomain;
                return (
                  <tr
                    key={row.domain}
                    className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/30 ${
                      selected ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => onSelect(row.domain)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(row.domain);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={selected}
                    aria-label={`View results for ${row.domain}`}
                  >
                    <td className="p-3 font-medium text-foreground">{row.domain}</td>
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
