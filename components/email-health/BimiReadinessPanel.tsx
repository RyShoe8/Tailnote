import type { BIMIResult } from '@/lib/email-health/bimiTypes';
import { vmcStatusFromResult } from '@/lib/email-health/bimiTypes';
import {
  BIMI_IMPLEMENTATION_STEPS,
  BIMI_REALITY_CHECK,
  BIMI_WHAT_IS,
  PAID_BIMI_HOSTING_CTA,
} from '@/lib/email-health/bimiCopy';
import type { CheckStatus } from '@/lib/email-health/types';
import { BimiCertificateGuide } from '@/components/email-health/BimiCertificateGuide';
import { BimiInboxPreview } from '@/components/email-health/BimiInboxPreview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IssueCard } from '@/components/email-health/IssueCard';
import Link from 'next/link';

function StatusPill({ status, label }: { status: CheckStatus | 'unknown'; label: string }) {
  const styles: Record<string, string> = {
    pass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    warn: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    fail: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    unknown: 'bg-muted text-muted-foreground',
  };
  const icons: Record<string, string> = { pass: '✓', warn: '!', fail: '✗', unknown: '?' };
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
      <span className="font-medium">{label}</span>
      <span
        className={`inline-flex min-w-[1.75rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status] ?? styles.unknown}`}
      >
        {icons[status] ?? '?'}
      </span>
    </div>
  );
}

function summaryLine(result: BIMIResult): string {
  if (result.status === 'pass') {
    return 'Your domain is ready for BIMI — your logo may appear in supporting inboxes.';
  }
  if (!result.dmarcStatus.eligibleForBimi) {
    return 'Fix email protection (DMARC) first, then set up your brand logo for inboxes.';
  }
  if (result.bimiRecordStatus.status === 'fail') {
    return 'Your domain is not yet set up to show a verified brand logo in supporting inboxes.';
  }
  return 'You are partway there — a few steps remain before inbox logo display is likely.';
}

export type BimiReadinessPanelProps = {
  bimi: BIMIResult;
  showPaidCta?: boolean;
  compact?: boolean;
  showEducation?: boolean;
};

export function BimiReadinessPanel({
  bimi,
  showPaidCta = false,
  compact = false,
  showEducation = true,
}: BimiReadinessPanelProps) {
  const vmcStatus = vmcStatusFromResult(bimi);
  const problemIssues = bimi.issues.filter((i) => i.severity === 'fail' || i.severity === 'warn');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand logo readiness</CardTitle>
          <CardDescription>{summaryLine(bimi)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <StatusPill
              status={bimi.dmarcStatus.status === 'unknown' ? 'unknown' : bimi.dmarcStatus.status}
              label="DMARC ready"
            />
            <StatusPill
              status={
                bimi.bimiRecordStatus.status === 'unknown' ? 'unknown' : bimi.bimiRecordStatus.status
              }
              label="BIMI record"
            />
            <StatusPill
              status={bimi.svgStatus.status === 'unknown' ? 'unknown' : bimi.svgStatus.status}
              label="Logo file"
            />
            <StatusPill status={vmcStatus} label="Certificate (VMC/CMC)" />
          </div>

          <BimiInboxPreview compact={compact} />

          {!compact ? (
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 p-4 text-sm">
              <p className="font-medium">Inbox provider notes</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>Gmail: {providerLabel(bimi.providerReadiness.gmail)}</li>
                <li>Yahoo: {providerLabel(bimi.providerReadiness.yahoo)}</li>
                <li>Fastmail: {providerLabel(bimi.providerReadiness.fastmail)}</li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">{BIMI_REALITY_CHECK.body}</p>
            </div>
          ) : null}

          {showPaidCta && bimi.status !== 'pass' ? (
            <p className="text-sm text-muted-foreground">
              {PAID_BIMI_HOSTING_CTA}{' '}
              <Link href="/pricing" className="font-medium text-primary underline underline-offset-4">
                See paid plans
              </Link>
            </p>
          ) : null}
        </CardContent>
      </Card>

      {problemIssues.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold tracking-tight">How to fix it</h3>
          {problemIssues.map((issue, idx) => (
            <IssueCard
              key={`${issue.title}-${idx}`}
              issue={{
                category: 'bimi',
                severity: issue.severity,
                title: issue.title,
                explanation: issue.plainEnglishExplanation,
                recommendation: issue.howToFix,
                technicalDetail: issue.technicalDetail,
                stepsToPass: [issue.howToFix],
              }}
            />
          ))}
        </section>
      ) : null}

      {showEducation ? <BimiEducationSection steps={bimi.implementationSteps} /> : null}
    </div>
  );
}

function providerLabel(status: CheckStatus | 'unknown'): string {
  switch (status) {
    case 'pass':
      return 'Likely ready (not guaranteed)';
    case 'warn':
      return 'May work with improvements';
    case 'fail':
      return 'Not ready yet';
    default:
      return 'Unknown';
  }
}

export function BimiEducationSection({ steps }: { steps?: string[] }) {
  const implementationSteps = steps?.length ? steps : BIMI_IMPLEMENTATION_STEPS;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">How to implement BIMI</CardTitle>
        <CardDescription>Plain-English steps for inbox brand logos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-medium">{BIMI_WHAT_IS.title}</p>
          <p className="mt-1 text-muted-foreground">{BIMI_WHAT_IS.body}</p>
        </div>
        <BimiCertificateGuide />
        <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
          {implementationSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
