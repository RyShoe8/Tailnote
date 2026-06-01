'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminEmailHealthScanRow, EmailHealthStatusLabel } from '@/lib/admin/emailHealthScans';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusBadgeVariant(status: EmailHealthStatusLabel): 'default' | 'accent' | 'outline' {
  if (status === 'Excellent') return 'accent';
  if (status === 'Good') return 'default';
  return 'outline';
}

type StatusFilter = 'all' | EmailHealthStatusLabel;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Good', label: 'Good' },
  { value: 'Needs Attention', label: 'Needs attention' },
  { value: 'High Risk', label: 'High risk' },
];

export function EmailHealthScansTable({ initialScans }: { initialScans: AdminEmailHealthScanRow[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const visibleScans = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialScans.filter((row) => {
      if (statusFilter !== 'all' && row.statusLabel !== statusFilter) return false;
      if (!q) return true;
      return row.domain.includes(q) || row.domainSlug.includes(q);
    });
  }, [initialScans, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Search domain…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Search domains"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              type="button"
              size="sm"
              variant={statusFilter === f.value ? 'default' : 'outline'}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="min-w-0 overflow-x-auto rounded-md border">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="p-3 font-medium">Domain</th>
                <th className="p-3 font-medium">Score</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Mail provider</th>
                <th className="p-3 font-medium">Scanned</th>
                <th className="p-3 font-medium w-28" />
              </tr>
            </thead>
            <tbody>
              {visibleScans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    {initialScans.length === 0
                      ? 'No domains scanned yet.'
                      : 'No domains match this filter.'}
                  </td>
                </tr>
              ) : (
                visibleScans.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="p-3 font-mono text-xs sm:text-sm">{row.domain}</td>
                    <td className="p-3 tabular-nums font-medium">{row.score}</td>
                    <td className="p-3">
                      <Badge variant={statusBadgeVariant(row.statusLabel)}>{row.statusLabel}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{row.mailProvider || '—'}</td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(row.scannedAt)}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/email-health/${row.domainSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View report
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
