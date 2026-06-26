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

export function TrustCenterSecurityFix({ issues, zoneDomain }: Props) {
  if (issues.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {issues.map((issue, i) => {
        const plain = plainIssueForTrustCenter(issue, { domain: zoneDomain });
        const fixRecords = (issue.dnsRecords ?? []).filter((r) => !r.exampleOnly);
        const currentRecord = currentRecordForIssue(issue);
        const showSteps =
          fixRecords.length === 0 && (issue.stepsToPass?.length ?? 0) > 0;

        return (
          <div
            key={`${issue.title}-${i}`}
            className="rounded-lg border border-border/60 bg-background p-4"
          >
            <p className="text-sm text-foreground">{plain.summary}</p>
            <p className="mt-2 text-sm text-muted-foreground">{plain.nextStep}</p>

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
                <p className="text-sm font-medium text-foreground">Replace with</p>
                {fixRecords.map((rec) => (
                  <DnsRecordCopy
                    key={`${rec.type}-${rec.host}-${rec.value}`}
                    record={rec}
                    zoneDomain={zoneDomain}
                  />
                ))}
              </div>
            ) : null}

            {showSteps ? (
              <div className="mt-3">
                <p className="text-sm font-medium text-foreground">Steps</p>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  {issue.stepsToPass!.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
