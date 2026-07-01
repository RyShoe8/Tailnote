'use client';

import type { BIMIResult } from '@/lib/email-health/bimiTypes';
import { buildBimiLogoSummary } from '@/lib/brandTrust/bimiLogoSummary';
import { BimiScoreBreakdown } from '@/components/email-health/BimiScoreBreakdown';
import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';

type Props = {
  bimiLogoUrl?: string;
  bimiLogoUploadedAt?: string | Date | null;
  bimiDetail?: BIMIResult | null;
};

export function BimiCurrentLogoPanel({ bimiLogoUrl, bimiLogoUploadedAt, bimiDetail }: Props) {
  const summary = buildBimiLogoSummary({
    bimiLogoUrl,
    bimiDetail,
    bimiLogoUploadedAt,
  });

  if (!summary.previewUrl && !bimiDetail) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Upload a logo to see file specs and inbox preview details here.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {summary.previewUrl ? (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border bg-white shadow-sm dark:bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={summary.uploadedAt?.getTime() ?? summary.previewUrl}
              src={summary.previewDisplayUrl ?? summary.previewUrl}
              alt="BIMI inbox logo"
              className="h-20 w-20 object-contain"
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium">Current inbox logo</h4>
            {summary.hostedWithTailnote ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Hosted with Tailnote
              </span>
            ) : summary.dnsLogoUrl ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                From DNS record
              </span>
            ) : null}
          </div>
          {summary.previewUrl ? (
            <p className="text-sm break-all text-muted-foreground">
              <a
                href={summary.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline"
              >
                {summary.previewUrl}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">{summary.status}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SpecCell label="Format" value={summary.specs.format} />
        <SpecCell
          label="Dimensions"
          value={
            summary.specs.width != null && summary.specs.height != null
              ? `${summary.specs.width} × ${summary.specs.height}px`
              : '—'
          }
        />
        <SpecCell label="File size" value={summary.specs.byteSizeKb ?? '—'} />
        <SpecCell
          label="Uploaded"
          value={
            summary.uploadedAt
              ? summary.uploadedAt.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : summary.hostedWithTailnote
                ? '—'
                : 'External'
          }
        />
      </div>

      {bimiDetail ? (
        <BimiScoreBreakdown bimi={bimiDetail} compact showInboxPreview={false} />
      ) : null}

      {summary.dnsMismatch ? (
        <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Your Tailnote-hosted logo URL does not match the <code className="text-xs">l=</code> tag in your
            published BIMI DNS record. Republish the suggested DNS record below so inboxes load the correct file.
          </p>
        </div>
      ) : null}

      {summary.improvements.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Room for improvement</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {summary.improvements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : summary.specsPass ? (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          All BIMI logo specs look good.
        </div>
      ) : null}
    </div>
  );
}

function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
