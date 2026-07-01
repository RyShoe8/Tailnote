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
  return lower.startsWith('v=spf1') || lower.startsWith('v=dmarc1') || lower.startsWith('v=bimi1');
}

function isMultiRecordFinding(detail: string): boolean {
  const lower = detail.trim().toLowerCase();
  return lower.startsWith('found ') && lower.includes('spf record');
}

function currentRecordForIssue(issue: DomainIssue): string | null {
  if (issue.foundRecords?.length) return null;
  const detail = issue.technicalDetail?.trim();
  if (!detail || !isDnsRecordValue(detail)) return null;
  if (isMultiRecordFinding(detail)) return null;
  const suggested = (issue.dnsRecords ?? []).find((r) => !r.exampleOnly)?.value;
  if (suggested && detail === suggested) return null;
  return detail;
}

function showStepsForIssue(issue: DomainIssue): boolean {
  if (!issue.stepsToPass?.length) return false;
  if (issue.severity !== 'fail' && issue.severity !== 'warn') return false;
  return true;
}

function foundRecordsLabel(issue: DomainIssue, zoneDomain: string): string {
  const t = `${issue.title} ${issue.category}`.toLowerCase();
  if (t.includes('different file') || t.includes('different logo')) {
    return 'Current vs expected logo URL';
  }
  if (issue.category === 'spf' || t.includes('multiple spf')) {
    return `SPF records found on ${zoneDomain}`;
  }
  return `What we found on ${zoneDomain}`;
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
        const foundRecords = issue.foundRecords?.filter(Boolean) ?? [];
        const multiSpfDetail =
          !foundRecords.length && issue.technicalDetail && isMultiRecordFinding(issue.technicalDetail)
            ? issue.technicalDetail
            : null;
        const issueText = `${issue.title} ${issue.explanation}`.toLowerCase();
        const showTitle =
          issue.title?.trim() &&
          issue.severity !== 'info' &&
          !plain.summary.toLowerCase().includes(issue.title.toLowerCase().slice(0, 24));

        return (
          <div
            key={`${issue.title}-${i}`}
            className="rounded-lg border border-border/60 bg-background p-4"
          >
            {showTitle ? (
              <p className="text-sm font-semibold text-foreground">{issue.title}</p>
            ) : null}
            <p className={`text-sm text-foreground ${showTitle ? 'mt-1' : ''}`}>{plain.summary}</p>
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

            {foundRecords.length > 0 ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {foundRecordsLabel(issue, zoneDomain)}
                </p>
                {foundRecords.map((record, j) => (
                  <div key={`${record}-${j}`} className="space-y-1">
                    {foundRecords.length > 1 ? (
                      <p className="text-xs font-medium text-muted-foreground">
                        {issueText.includes('different file') || issueText.includes('different logo')
                          ? j === 0
                            ? 'Current'
                            : 'Update to'
                          : `Record ${j + 1}`}
                      </p>
                    ) : null}
                    <pre className="overflow-x-auto rounded-md bg-slate-50 p-3 font-mono text-xs text-muted-foreground break-all whitespace-pre-wrap">
                      {record}
                    </pre>
                  </div>
                ))}
              </div>
            ) : null}

            {multiSpfDetail ? (
              <div className="mt-3 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  What we found on {zoneDomain}
                </p>
                <pre className="overflow-x-auto rounded-md bg-slate-50 p-3 font-mono text-xs text-muted-foreground break-all whitespace-pre-wrap">
                  {multiSpfDetail}
                </pre>
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
                  {currentRecord || foundRecords.length || multiSpfDetail
                    ? 'Replace with'
                    : 'Copy this record'}
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
