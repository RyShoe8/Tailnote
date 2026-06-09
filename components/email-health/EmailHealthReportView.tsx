import Link from 'next/link';
import { BimiCertificateSection } from '@/components/email-health/BimiCertificateSection';
import { CategoryBreakdown } from '@/components/email-health/CategoryBreakdown';
import { DnsRecordCopy } from '@/components/email-health/DnsRecordCopy';
import { EmailHealthDomainScanBar } from '@/components/email-health/EmailHealthDomainScanBar';
import { EmailHealthProblemsSection } from '@/components/email-health/EmailHealthProblemsSection';
import { EmailHealthRescanButton } from '@/components/email-health/EmailHealthRescanButton';
import { EmailHealthScoreRing } from '@/components/email-health/EmailHealthScoreRing';
import { EmailHealthTailnoteCta } from '@/components/email-health/EmailHealthTailnoteCta';
import { ScoreGuide } from '@/components/email-health/ScoreGuide';
import { buildStepsByCategory } from '@/lib/email-health/categoryGuide';
import { aggregateDnsRecords } from '@/lib/email-health/scoring';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';
import { absoluteUrl } from '@/lib/seo/site';

export type EmailHealthReportViewProps = {
  scan: SerializedEmailHealthScan;
  indexHref: string;
  sharePathPrefix?: string;
  showSignupCta?: boolean;
  breadcrumbRoot?: { href: string; label: string };
  showDomainScanField?: boolean;
  scanApiPath?: string;
  resultBasePath?: string;
};

export function EmailHealthReportView({
  scan,
  indexHref,
  sharePathPrefix = '/email-health',
  showSignupCta = true,
  breadcrumbRoot = { href: '/', label: 'Home' },
  showDomainScanField = false,
  scanApiPath = '/api/email-health/scan',
  resultBasePath = '/email-health',
}: EmailHealthReportViewProps) {
  const stepsByCategory = buildStepsByCategory(scan.issues);
  const dnsRecords = aggregateDnsRecords(scan.issues);
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
              {indexHref.includes('brand-trust') ? 'Brand Trust Center' : 'Email Health'}
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

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card lg:sticky lg:top-24">
          <EmailHealthScoreRing score={scan.score} statusLabel={scan.statusLabel} />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {scan.statusLabel === 'Excellent' || scan.statusLabel === 'Good'
              ? 'Your domain has solid email authentication basics.'
              : 'Address the items below to improve trust and deliverability.'}
          </p>
        </div>

        <div className="min-w-0 space-y-10">
          <ScoreGuide statusLabel={scan.statusLabel} />

          <section>
            <h2 className="text-lg font-semibold tracking-tight">Category breakdown</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Passing checks first, then items that still need work. Each card shows your points and
              how to earn full credit when not passing.
            </p>
            <div className="mt-4">
              <CategoryBreakdown
                categories={scan.categories}
                stepsByCategory={stepsByCategory}
                bimiDetail={scan.bimiDetail}
              />
            </div>
          </section>

          <EmailHealthProblemsSection issues={scan.issues} showPricingLink={showSignupCta} />

          {scan.bimiDetail ? (
            <BimiCertificateSection bimi={scan.bimiDetail} showHostingCallout={showSignupCta} />
          ) : null}

          {dnsRecords.length > 0 ? (
            <section>
              <h2 className="text-lg font-semibold tracking-tight">DNS records to add</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Copy these into your DNS provider. Values may need customization for your host.
              </p>
              <div className="mt-4 space-y-3">
                {dnsRecords.map((rec) => (
                  <DnsRecordCopy key={`${rec.type}-${rec.host}-${rec.value}`} record={rec} />
                ))}
              </div>
            </section>
          ) : null}

          {showSignupCta ? <EmailHealthTailnoteCta /> : null}
        </div>
      </div>

      <p className="mt-12 text-center text-xs text-muted-foreground">
        Share this report:{' '}
        <span className="font-mono">
          {absoluteUrl(`${sharePathPrefix}/${scan.domainSlug}`)}
        </span>
      </p>
    </>
  );
}
