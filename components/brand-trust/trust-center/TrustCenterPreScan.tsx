'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TRUST_CENTER_PRE_SCAN } from '@/lib/brandTrust/trustCenterCopy';

type Props = {
  initialDomain?: string;
  onScan: (domain: string) => Promise<void>;
};

export function TrustCenterPreScan({ initialDomain = '', onScan }: Props) {
  const [domain, setDomain] = useState(initialDomain);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onScan(domain.trim());
    } catch {
      setError('We could not complete the scan. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {TRUST_CENTER_PRE_SCAN.headline}
        </h1>
        <p className="text-muted-foreground">{TRUST_CENTER_PRE_SCAN.intro}</p>
        <p className="text-muted-foreground">
          {initialDomain
            ? TRUST_CENTER_PRE_SCAN.scanLead(initialDomain)
            : TRUST_CENTER_PRE_SCAN.scanLeadGeneric}
        </p>
        <ul className="mx-auto max-w-md space-y-2 text-left text-sm text-muted-foreground">
          {TRUST_CENTER_PRE_SCAN.bullets.map((bullet) => (
            <li key={bullet}>• {bullet}</li>
          ))}
        </ul>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-xl space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="yourcompany.com"
            required
            className="flex-1"
          />
          <Button type="submit" disabled={loading} className="gap-2 shrink-0">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Search className="h-4 w-4" aria-hidden />
            )}
            Scan
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </div>
  );
}
