'use client';

import { DnsRecordCopy } from '@/components/email-health/DnsRecordCopy';
import { plainIssueForTrustCenter } from '@/lib/brandTrust/plainIssueForTrustCenter';
import type { DomainIssue } from '@/lib/email-health/types';

type Props = {
  issues: DomainIssue[];
  zoneDomain: string;
};

export function TrustCenterSecurityFix({ issues, zoneDomain }: Props) {
  if (issues.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {issues.map((issue, i) => {
        const plain = plainIssueForTrustCenter(issue);
        return (
          <div
            key={`${issue.title}-${i}`}
            className="rounded-lg border border-border/60 bg-background p-4"
          >
            <p className="text-sm text-foreground">{plain.summary}</p>
            <p className="mt-2 text-sm text-muted-foreground">{plain.nextStep}</p>
            {(issue.dnsRecords ?? [])
              .filter((r) => !r.exampleOnly)
              .map((rec) => (
                <div key={`${rec.type}-${rec.host}`} className="mt-3">
                  <DnsRecordCopy record={rec} zoneDomain={zoneDomain} />
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
