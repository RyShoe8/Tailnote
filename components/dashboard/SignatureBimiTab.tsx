'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BimiLogoUpload } from '@/components/brand-trust/BimiLogoUpload';
import { BimiCurrentLogoPanel } from '@/components/brand-trust/BimiCurrentLogoPanel';
import { BimiCertificateGuide } from '@/components/email-health/BimiCertificateGuide';
import { BimiInboxPreview } from '@/components/email-health/BimiInboxPreview';
import { SIGNATURE_VS_INBOX_LOGO } from '@/lib/email-health/bimiCopy';

import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';

type BrandTrustPayload = {
  orgDomain: string | null;
  scan: SerializedEmailHealthScan | null;
  bimiLogoUrl?: string;
  bimiSuggestedRecord?: string;
  bimiLogoUploadedAt?: string | null;
  entitlements: { canUseBimiLogoHosting: boolean };
};

function newerIsoTimestamp(a?: string | null, b?: string | null): string | null {
  const aTime = a ? new Date(a).getTime() : NaN;
  const bTime = b ? new Date(b).getTime() : NaN;
  if (Number.isNaN(aTime) && Number.isNaN(bTime)) return null;
  if (Number.isNaN(aTime)) return b ?? null;
  if (Number.isNaN(bTime)) return a ?? null;
  return aTime >= bTime ? (a ?? null) : (b ?? null);
}

export function SignatureBimiTab({ canManageBimiLogo = true }: { canManageBimiLogo?: boolean }) {
  const [data, setData] = useState<BrandTrustPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const latestUploadAtRef = useRef<string | null>(null);

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch('/api/dashboard/brand-trust', { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Could not load BIMI status');
        return;
      }
      const fresh = json as BrandTrustPayload;
      setData((prev) => ({
        ...fresh,
        bimiLogoUploadedAt: newerIsoTimestamp(
          latestUploadAtRef.current ?? prev?.bimiLogoUploadedAt,
          fresh.bimiLogoUploadedAt,
        ),
      }));
    } catch {
      setError('Could not load BIMI status');
    } finally {
      if (!opts?.silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleRescanAfterUpload = async () => {
    if (!data?.orgDomain) return;
    try {
      const res = await fetch('/api/dashboard/brand-trust/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: data.orgDomain, force: true }),
        credentials: 'include',
      });
      if (res.ok) {
        await load({ silent: true });
      }
    } catch {
      // Background refresh only — upload already succeeded
    }
  };

  const handleBimiUploaded = (payload: {
    url: string;
    suggestedRecord: string;
    uploadedAt: string;
  }) => {
    latestUploadAtRef.current = payload.uploadedAt;
    setData((prev) =>
      prev
        ? {
            ...prev,
            bimiLogoUrl: payload.url,
            bimiSuggestedRecord: payload.suggestedRecord,
            bimiLogoUploadedAt: payload.uploadedAt,
          }
        : prev,
    );
  };

  const handleRescan = async () => {
    if (!data?.orgDomain) return;
    setIsScanning(true);
    try {
      const res = await fetch('/api/dashboard/brand-trust/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: data.orgDomain, force: true }),
        credentials: 'include',
      });
      if (res.ok) {
        await load({ silent: true });
      }
    } finally {
      setIsScanning(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading brand strength status…</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!data?.orgDomain) {
    return (
      <CardShell>
        <p className="text-sm text-muted-foreground">
          Add your company website on the Brand tab so we can check Brand Strength readiness for your domain.
        </p>
        <Link href="/dashboard/brand-trust" className="text-sm font-medium text-primary underline">
          Open Brand Strength
        </Link>
      </CardShell>
    );
  }

  const bimiResult = data.scan?.categories?.find((c) => c.category === 'bimi');
  const dmarcStatus = data.scan?.bimiDetail?.dmarcStatus;
  const bimiRecordStatus = data.scan?.bimiDetail?.bimiRecordStatus;
  const svgStatus = data.scan?.bimiDetail?.svgStatus;
  const certificateStatus = data.scan?.bimiDetail?.certificateStatus;

  const isSelfAssertedBimi =
    dmarcStatus?.status !== 'fail' &&
    bimiRecordStatus?.status === 'pass' &&
    svgStatus?.status === 'pass' &&
    (certificateStatus?.classification === 'none' || certificateStatus?.classification === 'self_asserted');

  const passed = isSelfAssertedBimi || bimiResult?.status === 'pass';
  const hasUploadedLogo = !!data.bimiLogoUrl?.trim();
  const missingVmc = certificateStatus?.classification === 'none';

  return (
    <div className="space-y-6">
      <CardShell>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              {passed ? (
                <><CheckCircle2 className="w-5 h-5 text-green-500" /> Brand Strength: Excellent</>
              ) : (
                <><AlertCircle className="w-5 h-5 text-amber-500" /> Brand Strength: Needs Action</>
              )}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Domain: <span className="font-medium text-foreground">{data.orgDomain}</span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void handleRescan()} disabled={isScanning}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Rescan Domain'}
          </Button>
        </div>
      </CardShell>

      {passed ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-200">
          Your brand logo is ready for supporting inboxes on <strong>{data.orgDomain}</strong>. You can review
          specs or replace the file below.
        </div>
      ) : null}

      <BimiCurrentLogoPanel
        bimiLogoUrl={data.bimiLogoUrl}
        bimiLogoUploadedAt={data.bimiLogoUploadedAt}
        bimiDetail={data.scan?.bimiDetail}
      />

      {!passed ? (
        <CardShell>
          <h4 className="font-medium mb-2">How to get your logo in the inbox</h4>
          <p className="text-sm text-muted-foreground mb-4">{SIGNATURE_VS_INBOX_LOGO}</p>
          {!canManageBimiLogo ? (
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              Brand inbox logo upload is managed by your organization owner or admin. You can still review DNS
              requirements and preview how your logo may appear.
            </p>
          ) : null}
        </CardShell>
      ) : null}

      {!passed && dmarcStatus?.status === 'fail' ? (
        <CardShell>
          <h4 className="font-medium text-amber-600 mb-2">Step 1: Upgrade DMARC Security</h4>
          <p className="text-sm text-muted-foreground mb-4">
            BIMI requires strict email security. Your domain&apos;s DMARC policy must be set to{' '}
            <code>quarantine</code> or <code>reject</code>.
          </p>
          <Link href="/dashboard/brand-trust" className="text-sm font-medium text-primary underline">
            Fix this in Brand Strength
          </Link>
        </CardShell>
      ) : null}

      {canManageBimiLogo ? (
        <div className="space-y-4">
          {!passed ? (
            <h4 className="font-medium">
              Step {dmarcStatus?.status === 'fail' ? '2' : '1'}: {hasUploadedLogo ? 'Replace' : 'Upload'} your logo
            </h4>
          ) : (
            <h4 className="font-medium">{hasUploadedLogo ? 'Replace inbox logo' : 'Upload inbox logo'}</h4>
          )}
          {!passed && hasUploadedLogo && svgStatus?.status !== 'pass' && (svgStatus?.issues?.length ?? 0) > 0 ? (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              <p className="font-semibold mb-1">Logo issues detected:</p>
              <ul className="list-disc pl-5">
                {svgStatus?.issues?.map((issue: string, i: number) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <BimiLogoUpload
            canUseBimiLogoHosting={data.entitlements.canUseBimiLogoHosting}
            bimiLogoUrl={data.bimiLogoUrl}
            bimiLogoUploadedAt={data.bimiLogoUploadedAt}
            bimiSuggestedRecord={data.bimiSuggestedRecord}
            hidePreview
            hideTitle
            onUploaded={handleBimiUploaded}
            onRescanRequested={() => void handleRescanAfterUpload()}
          />
        </div>
      ) : null}

      <BimiInboxPreview compact />

      <CardShell>
        <div className="space-y-4">
          <BimiCertificateGuide compact />
          {missingVmc ? (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium text-amber-600">Note for small businesses</p>
              <p className="text-sm text-muted-foreground mt-1">
                We detected that your domain does not have a VMC certificate. These certificates cost around
                $1,500/year and are generally only needed for enterprise brands aiming for Gmail compatibility.{' '}
                <strong>Most small companies do not need a VMC certificate</strong> and should simply use the
                self-asserted setup provided above.
              </p>
            </div>
          ) : null}
        </div>
      </CardShell>
    </div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">{children}</div>
  );
}
