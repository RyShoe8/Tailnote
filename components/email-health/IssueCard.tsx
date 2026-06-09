'use client';

import Link from 'next/link';
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

function technicalDetailDuplicatesDns(issue: DomainIssue): boolean {
  if (!issue.technicalDetail || !issue.dnsRecords?.length) return false;
  return issue.dnsRecords.some(
    (rec) =>
      issue.technicalDetail!.includes(rec.value) ||
      issue.technicalDetail!.includes('Illustrative example'),
  );
}

type Props = {
  issue: DomainIssue;
  showPricingLink?: boolean;
  zoneDomain?: string;
};

export function IssueCard({ issue, showPricingLink = true, zoneDomain }: Props) {
  const hasDns = (issue.dnsRecords?.length ?? 0) > 0;
  const showSteps =
    (issue.severity === 'warn' || issue.severity === 'fail') &&
    (issue.stepsToPass?.length ?? 0) > 0 &&
    !(hasDns && issue.stepsToPass!.length === 1);
  const showRecommendation =
    !hasDns &&
    ((issue.severity === 'warn' || issue.severity === 'fail') || issue.recommendation);
  const showTechnical =
    Boolean(issue.technicalDetail) && !technicalDetailDuplicatesDns(issue);

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

      {hasDns ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-foreground">DNS record to add</p>
          <p className="text-xs text-muted-foreground">
            Paste these into your DNS provider&apos;s add-record form.
          </p>
          {issue.dnsRecords!.map((rec) => (
            <DnsRecordCopy
              key={`${rec.type}-${rec.host}-${rec.value}`}
              record={rec}
              zoneDomain={zoneDomain}
            />
          ))}
        </div>
      ) : null}

      {issue.callout ? (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-muted-foreground">
          {issue.callout}{' '}
          {showPricingLink ? (
            <Link href="/pricing" className="font-medium text-primary underline underline-offset-4">
              See paid plans
            </Link>
          ) : null}
        </div>
      ) : null}

      {showSteps ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">Steps to pass</p>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            {issue.stepsToPass!.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {showRecommendation ? (
        <p className="mt-3 text-sm text-foreground">
          <span className="font-medium">Recommended fix: </span>
          {issue.recommendation}
        </p>
      ) : null}

      {showTechnical ? (
        <Collapsible className="mt-4">
          <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-primary hover:underline [&[data-state=open]>svg]:rotate-180">
            View technical details
            <ChevronDown className="h-4 w-4 transition-transform" aria-hidden />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 rounded-md bg-slate-50 p-3 font-mono text-xs text-muted-foreground break-all whitespace-pre-wrap">
            {issue.technicalDetail}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </article>
  );
}
