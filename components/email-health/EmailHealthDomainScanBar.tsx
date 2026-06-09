'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { capturePostHogEvent } from '@/components/analytics/PostHogProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  defaultDomain: string;
  currentDomainSlug?: string;
  scanApiPath?: string;
  resultBasePath?: string;
};

export function EmailHealthDomainScanBar({
  defaultDomain,
  currentDomainSlug,
  scanApiPath = '/api/email-health/scan',
  resultBasePath = '/email-health',
}: Props) {
  const router = useRouter();
  const [domain, setDomain] = useState(defaultDomain);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [rescanning, setRescanning] = useState(false);

  async function runScan(force: boolean) {
    const trimmed = domain.trim();
    if (!trimmed) return;

    setError(null);
    if (force) {
      setRescanning(true);
    } else {
      setScanning(true);
    }

    capturePostHogEvent('email_health_scan_started', { domain: trimmed, force });

    try {
      const res = await fetch(scanApiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: trimmed, force }),
        credentials: scanApiPath.includes('/dashboard/') ? 'include' : undefined,
      });
      const data = (await res.json()) as { slug?: string; error?: string; cached?: boolean; score?: number };

      if (!res.ok) {
        setError(data.error ?? 'Scan failed. Try again.');
        return;
      }

      capturePostHogEvent('email_health_scan_completed', {
        domain: trimmed,
        cached: Boolean(data.cached),
        score: data.score ?? 0,
      });

      if (!data.slug) {
        router.refresh();
        return;
      }

      const base = resultBasePath.replace(/\/$/, '');
      const onSameReport = currentDomainSlug && data.slug === currentDomainSlug;

      if (force && onSameReport) {
        router.refresh();
      } else if (!onSameReport) {
        router.push(`${base}/${data.slug}`);
      } else {
        router.refresh();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setScanning(false);
      setRescanning(false);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="yourcompany.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          disabled={scanning || rescanning}
          className="sm:flex-1"
          aria-label="Domain to scan"
        />
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            size="sm"
            disabled={scanning || rescanning || !domain.trim()}
            className="gap-1.5"
            onClick={() => void runScan(false)}
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Search className="h-4 w-4" aria-hidden />
            )}
            Scan
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={scanning || rescanning || !domain.trim()}
            className="gap-1.5"
            onClick={() => void runScan(true)}
          >
            {rescanning ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Rescan
          </Button>
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
