'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrustCenterScanExplainer } from '@/components/brand-trust/trust-center/TrustCenterScanExplainer';
import { TRUST_CENTER_PRE_SCAN } from '@/lib/brandTrust/trustCenterCopy';

type Props = {
  initialDomain?: string;
  onScan: (domain: string) => Promise<void>;
  showHeading?: boolean;
};

export function TrustCenterPreScan({
  initialDomain = '',
  onScan,
  showHeading = true,
}: Props) {
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
    <div className="mx-auto max-w-3xl space-y-8">
      {showHeading ? (
        <div className="mx-auto max-w-xl space-y-3 text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {TRUST_CENTER_PRE_SCAN.headline}
          </h1>
          <p className="text-muted-foreground">{TRUST_CENTER_PRE_SCAN.intro}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200/80 bg-card p-6 shadow-card sm:p-8">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {initialDomain
              ? TRUST_CENTER_PRE_SCAN.scanLead(initialDomain)
              : TRUST_CENTER_PRE_SCAN.scanLeadGeneric}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="yourcompany.com"
              required
              className="h-11 flex-1 text-base"
            />
            <Button type="submit" disabled={loading} size="lg" className="gap-2 shrink-0">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Search className="h-4 w-4" aria-hidden />
              )}
              Scan domain
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      </div>

      <section className="space-y-4">
        <h2 className="text-center text-sm font-medium text-foreground">
          What we check — and how we help you fix it
        </h2>
        <TrustCenterScanExplainer variant="full" />
      </section>

      <p className="text-center text-xs text-muted-foreground">{TRUST_CENTER_PRE_SCAN.trustLine}</p>
    </div>
  );
}
