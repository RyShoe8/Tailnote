'use client';

import Link from 'next/link';
import { BimiLogoUpload } from '@/components/brand-trust/BimiLogoUpload';
import { DomainScanForm } from '@/components/email-health/DomainScanForm';
import { EmailHealthReportView } from '@/components/email-health/EmailHealthReportView';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';

type Props = {
  orgDomain: string | null;
  scan: SerializedEmailHealthScan | null;
  canUseBimiLogoHosting: boolean;
  bimiLogoUrl?: string;
  bimiSuggestedRecord?: string;
};

export function BrandTrustHubClient({
  orgDomain,
  scan,
  canUseBimiLogoHosting,
  bimiLogoUrl,
  bimiSuggestedRecord,
}: Props) {
  if (!orgDomain) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brand Trust Center</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your company website on the{' '}
            <Link href="/dashboard/signature?tab=brand" className="text-primary underline">
              Signature
            </Link>{' '}
            tab so we can check your domain. Or scan any domain below.
          </p>
        </div>
        <DomainScanForm
          size="large"
          resultBasePath="/dashboard/brand-trust"
          scanApiPath="/api/dashboard/brand-trust/scan"
        />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brand Trust Center</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Scan {orgDomain} to see authentication, BIMI readiness, and next steps.
          </p>
        </div>
        <DomainScanForm
          initialDomain={orgDomain}
          size="large"
          resultBasePath="/dashboard/brand-trust"
          scanApiPath="/api/dashboard/brand-trust/scan"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <EmailHealthReportView
        scan={scan}
        indexHref="/dashboard/brand-trust"
        sharePathPrefix="/email-health"
        showSignupCta={!canUseBimiLogoHosting}
        breadcrumbRoot={{ href: '/dashboard', label: 'Overview' }}
        showDomainScanField
        scanApiPath="/api/dashboard/brand-trust/scan"
        resultBasePath="/dashboard/brand-trust"
      />

      <BimiLogoUpload
        canUseBimiLogoHosting={canUseBimiLogoHosting}
        bimiLogoUrl={bimiLogoUrl}
        bimiSuggestedRecord={bimiSuggestedRecord}
      />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/email-health" className="text-primary underline">
          Public email health checker
        </Link>
      </p>
    </div>
  );
}
