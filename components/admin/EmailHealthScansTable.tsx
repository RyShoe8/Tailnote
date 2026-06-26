'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Trash2 } from 'lucide-react';
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
  const [scans, setScans] = useState(initialScans);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleScans = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scans.filter((row) => {
      if (statusFilter !== 'all' && row.statusLabel !== statusFilter) return false;
      if (!q) return true;
      return row.domain.includes(q) || row.domainSlug.includes(q);
    });
  }, [scans, search, statusFilter]);

  async function handleDelete(id: string, domain: string) {
    if (!window.confirm(`Delete the scan for ${domain}? This cannot be undone.`)) return;
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/email-health/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Delete failed');
      }
      setScans((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

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
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="min-w-0 overflow-x-auto rounded-md border">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="p-3 font-medium">Domain</th>
                <th className="p-3 font-medium">Score</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Mail provider</th>
                <th className="p-3 font-medium">Scanned</th>
                <th className="p-3 font-medium w-36" />
              </tr>
            </thead>
            <tbody>
              {visibleScans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    {scans.length === 0
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
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/email-health/${row.domainSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View report
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={deletingId === row.id}
                          onClick={() => void handleDelete(row.id, row.domain)}
                          aria-label={`Delete scan for ${row.domain}`}
                        >
                          {deletingId === row.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <Trash2 className="h-4 w-4" aria-hidden />
                          )}
                        </Button>
                      </div>
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
