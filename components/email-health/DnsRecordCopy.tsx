'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DnsRecordSuggestion } from '@/lib/email-health/types';

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
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {record.type} · {record.host}
          </p>
          <p className="mt-1 break-all font-mono text-xs text-foreground">{record.value}</p>
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
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}
