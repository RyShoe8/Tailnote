'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  onScan: (domain: string) => Promise<void>;
  defaultDomain?: string;
};

export function TrustCenterScanAnother({ onScan, defaultDomain = '' }: Props) {
  const [domain, setDomain] = useState(defaultDomain);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = domain.trim();
    if (!trimmed) return;
    setError(null);
    setLoading(true);
    try {
      await onScan(trimmed);
      setDomain('');
    } catch {
      setError('We could not complete the scan. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
      <p className="text-sm font-medium text-foreground">Scan another domain</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="another-domain.com"
          className="flex-1"
          aria-label="Domain to scan"
        />
        <Button type="submit" size="sm" disabled={loading} className="gap-2 shrink-0">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-4 w-4" aria-hidden />
          )}
          Scan domain
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
