'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DnsRecordSuggestion } from '@/lib/email-health/types';
import { cn } from '@/lib/utils';

type Props = {
  record: DnsRecordSuggestion;
};

export function DnsRecordCopy({ record }: Props) {
  const [copied, setCopied] = useState(false);
  const text = `${record.type} ${record.host} → ${record.value}`;

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
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {record.type} · {record.host}
            </p>
            {record.exampleOnly ? (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                Example only
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 break-all font-mono text-xs text-foreground">{record.value}</p>
          {record.note ? <p className="mt-2 text-xs text-muted-foreground">{record.note}</p> : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1"
          onClick={copy}
          aria-label={`Copy DNS record: ${text}`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : record.exampleOnly ? 'Copy example' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}
