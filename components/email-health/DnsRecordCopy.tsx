'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dnsHostForProvider } from '@/lib/email-health/dnsHost';
import type { DnsRecordSuggestion } from '@/lib/email-health/types';
import { cn } from '@/lib/utils';

type Props = {
  record: DnsRecordSuggestion;
  zoneDomain?: string;
};

export function DnsRecordCopy({ record, zoneDomain }: Props) {
  const [copied, setCopied] = useState(false);
  const hostName = dnsHostForProvider(record.host, zoneDomain);
  const text = `${record.type} ${hostName} → ${record.value}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(record.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-slate-50/80 p-3',
        record.exampleOnly ? 'border-dashed border-amber-300/80 bg-amber-50/40' : 'border-slate-200',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {record.exampleOnly ? (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                Example only
              </Badge>
            ) : null}
          </div>
          <dl className="grid gap-2 text-xs">
            <div className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-0.5">
              <dt className="font-medium text-muted-foreground">Record type</dt>
              <dd className="font-mono text-foreground">{record.type}</dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-0.5">
              <dt className="font-medium text-muted-foreground">Host / name</dt>
              <dd className="break-all font-mono text-foreground">{hostName}</dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-0.5">
              <dt className="font-medium text-muted-foreground">Value / content</dt>
              <dd className="break-all font-mono text-foreground">{record.value}</dd>
            </div>
          </dl>
          {record.note ? <p className="text-xs text-muted-foreground">{record.note}</p> : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1"
          onClick={copy}
          aria-label={`Copy DNS record value: ${text}`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : record.exampleOnly ? 'Copy example' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}
