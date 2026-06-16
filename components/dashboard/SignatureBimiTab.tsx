'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BimiLogoUpload } from '@/components/brand-trust/BimiLogoUpload';
import { BimiCertificateGuide } from '@/components/email-health/BimiCertificateGuide';
import { BimiInboxPreview } from '@/components/email-health/BimiInboxPreview';
import { SIGNATURE_VS_INBOX_LOGO } from '@/lib/email-health/bimiCopy';

type BrandTrustPayload = {
  orgDomain: string | null;
  scan: unknown;
  bimiLogoUrl?: string;
  bimiSuggestedRecord?: string;
  entitlements: { canUseBimiLogoHosting: boolean };
};

export function SignatureBimiTab({ canManageBimiLogo = true }: { canManageBimiLogo?: boolean }) {
  const [data, setData] = useState<BrandTrustPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/dashboard/brand-trust', { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof json.error === 'string' ? json.error : 'Could not load BIMI status');
          return;
        }
        setData(json as BrandTrustPayload);
      } catch {
        setError('Could not load BIMI status');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading brand logo status…</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!data?.orgDomain) {
    return (
      <CardShell>
        <p className="text-sm text-muted-foreground">
          Add your company website on the Brand tab so we can check BIMI readiness for your domain.
        </p>
        <Link href="/dashboard/brand-trust" className="text-sm font-medium text-primary underline">
          Open Brand Trust Center
        </Link>
      </CardShell>
    );
  }

  return (
    <div className="space-y-6">
      <CardShell>
        <p className="text-sm text-muted-foreground">{SIGNATURE_VS_INBOX_LOGO}</p>
        {!canManageBimiLogo ? (
          <p className="mt-2 text-sm text-muted-foreground">
            BIMI inbox logo upload is managed by your organization owner or admin. You can still
            review DNS requirements and preview how your logo may appear.
          </p>
        ) : null}
        <p className="mt-2 text-sm">
          Domain: <span className="font-medium">{data.orgDomain}</span>
        </p>
        <Link
          href="/dashboard/brand-trust"
          className="mt-2 inline-block text-sm font-medium text-primary underline"
        >
          Full Brand Trust Center scan
        </Link>
      </CardShell>

      <BimiLogoUpload
        canUseBimiLogoHosting={data.entitlements.canUseBimiLogoHosting && canManageBimiLogo}
        bimiLogoUrl={data.bimiLogoUrl}
        bimiSuggestedRecord={data.bimiSuggestedRecord}
      />

      <BimiInboxPreview compact />

      <CardShell>
        <BimiCertificateGuide compact />
      </CardShell>
    </div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">{children}</div>
  );
}
