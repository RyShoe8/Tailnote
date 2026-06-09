import type { BIMIResult } from '@/lib/email-health/bimiTypes';
import {
  BIMI_IMPLEMENTATION_STEPS,
  BIMI_REALITY_CHECK,
  BIMI_WHAT_IS,
  PAID_BIMI_HOSTING_CTA,
} from '@/lib/email-health/bimiCopy';
import type { CheckStatus } from '@/lib/email-health/types';
import { BimiCertificateGuide } from '@/components/email-health/BimiCertificateGuide';
import { BimiScoreBreakdown } from '@/components/email-health/BimiScoreBreakdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IssueCard } from '@/components/email-health/IssueCard';
import Link from 'next/link';

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
  showIssueCards?: boolean;
};

export function BimiReadinessPanel({
  bimi,
  showPaidCta = false,
  compact = false,
  showEducation = true,
  showIssueCards = true,
}: BimiReadinessPanelProps) {
  const problemIssues = bimi.issues.filter((i) => i.severity === 'fail' || i.severity === 'warn');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand logo readiness</CardTitle>
          <CardDescription>{summaryLine(bimi)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BimiScoreBreakdown bimi={bimi} compact={compact} />

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

      {showIssueCards && problemIssues.length > 0 ? (
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
                dnsRecords: issue.dnsRecords,
                callout: issue.callout,
                stepsToPass: issue.dnsRecords?.length ? undefined : [issue.howToFix],
              }}
              zoneDomain={bimi.domain}
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
