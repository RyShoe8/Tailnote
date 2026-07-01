import Link from 'next/link';
import { BrandTrustHubClient } from '@/components/brand-trust/BrandTrustHubClient';
import { EmailHealthDomainScanBar } from '@/components/email-health/EmailHealthDomainScanBar';
import { EmailHealthReportShare } from '@/components/email-health/EmailHealthReportShare';
import { EmailHealthRescanButton } from '@/components/email-health/EmailHealthRescanButton';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';

export type EmailHealthReportViewProps = {
  scan: SerializedEmailHealthScan;
  indexHref: string;
  sharePathPrefix?: string;
  breadcrumbRoot?: { href: string; label: string };
  showDomainScanField?: boolean;
  scanApiPath?: string;
  resultBasePath?: string;
};

export function EmailHealthReportView({
  scan,
  indexHref,
  sharePathPrefix = '/email-health',
  breadcrumbRoot = { href: '/', label: 'Home' },
  showDomainScanField = false,
  scanApiPath = '/api/email-health/scan',
  resultBasePath = '/email-health',
}: EmailHealthReportViewProps) {
  const scannedLabel = new Date(scan.scannedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={breadcrumbRoot.href} className="transition-colors hover:text-foreground">
              {breadcrumbRoot.label}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={indexHref} className="transition-colors hover:text-foreground">
              {indexHref.includes('brand-trust') ? 'Brand Strength' : 'Email Health'}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-foreground">{scan.domain}</li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{scan.domain}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Last scanned {scannedLabel}
            {scan.mailProvider ? ` · Likely hosted on ${scan.mailProvider}` : ''}
          </p>
        </div>
        {showDomainScanField ? (
          <EmailHealthDomainScanBar
            defaultDomain={scan.domain}
            currentDomainSlug={scan.domainSlug}
            scanApiPath={scanApiPath}
            resultBasePath={resultBasePath}
          />
        ) : (
          <EmailHealthRescanButton domain={scan.domain} />
        )}
      </div>

      <div className="mt-10">
        <BrandTrustHubClient variant="public" initialScan={scan} />
      </div>

      <div className="mt-16">
        <EmailHealthReportShare
          domain={scan.domain}
          domainSlug={scan.domainSlug}
          sharePathPrefix={sharePathPrefix}
        />
      </div>
    </>
  );
}
