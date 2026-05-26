'use client';

import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DnsRecordCopy } from '@/components/email-health/DnsRecordCopy';
import type { DomainIssue } from '@/lib/email-health/types';

function severityVariant(severity: DomainIssue['severity']) {
  if (severity === 'fail') return 'default' as const;
  if (severity === 'warn') return 'outline' as const;
  return 'accent' as const;
}

type Props = {
  issue: DomainIssue;
};

export function IssueCard({ issue }: Props) {
  const showTechnical = Boolean(issue.technicalDetail);
  const hasDns = (issue.dnsRecords?.length ?? 0) > 0;

  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={severityVariant(issue.severity)} className="capitalize">
          {issue.severity}
        </Badge>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {issue.category}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-foreground">{issue.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{issue.explanation}</p>
      <p className="mt-3 text-sm text-foreground">
        <span className="font-medium">Recommended fix: </span>
        {issue.recommendation}
      </p>

      {hasDns ? (
        <div className="mt-4 space-y-2">
          {issue.dnsRecords!.map((rec) => (
            <DnsRecordCopy key={`${rec.type}-${rec.host}-${rec.value}`} record={rec} />
          ))}
        </div>
      ) : null}

      {showTechnical ? (
        <Collapsible className="mt-4">
          <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-primary hover:underline [&[data-state=open]>svg]:rotate-180">
            View technical details
            <ChevronDown className="h-4 w-4 transition-transform" aria-hidden />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 rounded-md bg-slate-50 p-3 font-mono text-xs text-muted-foreground break-all">
            {issue.technicalDetail}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </article>
  );
}
