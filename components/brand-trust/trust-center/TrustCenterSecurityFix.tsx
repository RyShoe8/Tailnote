'use client';

import { DnsRecordCopy } from '@/components/email-health/DnsRecordCopy';
import { plainIssueForTrustCenter } from '@/lib/brandTrust/plainIssueForTrustCenter';
import type { DomainIssue } from '@/lib/email-health/types';

type Props = {
  issues: DomainIssue[];
  zoneDomain: string;
};

function isDnsRecordValue(detail: string): boolean {
  const lower = detail.trim().toLowerCase();
  return lower.startsWith('v=spf1') || lower.startsWith('v=dmarc1');
}

function currentRecordForIssue(issue: DomainIssue): string | null {
  const detail = issue.technicalDetail?.trim();
  if (!detail || !isDnsRecordValue(detail)) return null;
  const suggested = (issue.dnsRecords ?? []).find((r) => !r.exampleOnly)?.value;
  if (suggested && detail === suggested) return null;
  return detail;
}

function showStepsForIssue(issue: DomainIssue): boolean {
  if (!issue.stepsToPass?.length) return false;
  if (issue.severity !== 'fail' && issue.severity !== 'warn') return false;
  return true;
}

export function TrustCenterSecurityFix({ issues, zoneDomain }: Props) {
  if (issues.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {issues.map((issue, i) => {
        const plain = plainIssueForTrustCenter(issue, { domain: zoneDomain });
        const fixRecords = (issue.dnsRecords ?? []).filter((r) => !r.exampleOnly);
        const exampleRecords = (issue.dnsRecords ?? []).filter((r) => r.exampleOnly);
        const currentRecord = currentRecordForIssue(issue);
        const showSteps = showStepsForIssue(issue);

        return (
          <div
            key={`${issue.title}-${i}`}
            className="rounded-lg border border-border/60 bg-background p-4"
          >
            <p className="text-sm text-foreground">{plain.summary}</p>
            <p className="mt-2 text-sm text-muted-foreground">{plain.nextStep}</p>

            {issue.callout ? (
              <p className="mt-3 rounded-md bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
                {issue.callout}
              </p>
            ) : null}

            {showSteps ? (
              <div className="mt-3">
                <p className="text-sm font-medium text-foreground">How to set this up</p>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  {issue.stepsToPass!.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}

            {currentRecord ? (
              <div className="mt-3 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  What we found on {zoneDomain}
                </p>
                <pre className="overflow-x-auto rounded-md bg-slate-50 p-3 font-mono text-xs text-muted-foreground break-all whitespace-pre-wrap">
                  {currentRecord}
                </pre>
              </div>
            ) : null}

            {fixRecords.length > 0 ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {currentRecord ? 'Replace with' : 'Copy this record'}
                </p>
                {fixRecords.map((rec) => (
                  <DnsRecordCopy
                    key={`${rec.type}-${rec.host}-${rec.value}`}
                    record={rec}
                    zoneDomain={zoneDomain}
                  />
                ))}
              </div>
            ) : null}

            {exampleRecords.length > 0 ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-foreground">Example record shape</p>
                {exampleRecords.map((rec) => (
                  <DnsRecordCopy
                    key={`${rec.type}-${rec.host}-${rec.value}`}
                    record={rec}
                    zoneDomain={zoneDomain}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
