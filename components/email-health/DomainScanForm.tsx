'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { capturePostHogEvent } from '@/components/analytics/PostHogProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  initialDomain?: string;
  size?: 'default' | 'large';
};

export function DomainScanForm({ initialDomain = '', size = 'default' }: Props) {
  const router = useRouter();
  const [domain, setDomain] = useState(initialDomain);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    capturePostHogEvent('email_health_scan_started', { domain: domain.trim() });

    try {
      const res = await fetch('/api/email-health/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = (await res.json()) as {
        slug?: string;
        error?: string;
        cached?: boolean;
        score?: number;
      };

      if (!res.ok) {
        setError(data.error ?? 'Scan failed. Try again.');
        setLoading(false);
        return;
      }

      capturePostHogEvent('email_health_scan_completed', {
        domain: domain.trim(),
        cached: Boolean(data.cached),
        score: data.score ?? 0,
      });

      if (data.slug) {
        router.push(`/email-health/${data.slug}`);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  const isLarge = size === 'large';

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div
        className={
          isLarge
            ? 'flex flex-col gap-3 sm:flex-row sm:items-center'
            : 'flex flex-col gap-2 sm:flex-row'
        }
      >
        <Input
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="yourcompany.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          disabled={loading}
          className={isLarge ? 'h-14 text-base sm:flex-1' : 'sm:flex-1'}
          aria-label="Domain name"
        />
        <Button
          type="submit"
          size={isLarge ? 'lg' : 'default'}
          disabled={loading || !domain.trim()}
          className={isLarge ? 'h-14 gap-2 px-8' : 'gap-2'}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Search className="h-4 w-4" aria-hidden />
          )}
          {loading ? 'Scanning…' : 'Check health'}
        </Button>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
