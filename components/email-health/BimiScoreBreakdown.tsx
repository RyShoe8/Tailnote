import type { BIMIResult } from '@/lib/email-health/bimiTypes';
import { vmcStatusFromResult } from '@/lib/email-health/bimiTypes';
import { BimiInboxPreview } from '@/components/email-health/BimiInboxPreview';
import type { CheckStatus } from '@/lib/email-health/types';

function StatusPill({ status, label }: { status: CheckStatus | 'unknown'; label: string }) {
  const styles: Record<string, string> = {
    pass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    warn: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    fail: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    unknown: 'bg-muted text-muted-foreground',
  };
  const icons: Record<string, string> = { pass: '✓', warn: '!', fail: '✗', unknown: '?' };
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
      <span className="font-medium">{label}</span>
      <span
        className={`inline-flex min-w-[1.75rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status] ?? styles.unknown}`}
      >
        {icons[status] ?? '?'}
      </span>
    </div>
  );
}

export type BimiScoreBreakdownProps = {
  bimi: BIMIResult;
  compact?: boolean;
  showInboxPreview?: boolean;
};

export function BimiScoreBreakdown({
  bimi,
  compact = false,
  showInboxPreview = true,
}: BimiScoreBreakdownProps) {
  const vmcStatus = vmcStatusFromResult(bimi);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <StatusPill
          status={bimi.dmarcStatus.status === 'unknown' ? 'unknown' : bimi.dmarcStatus.status}
          label="DMARC ready"
        />
        <StatusPill
          status={
            bimi.bimiRecordStatus.status === 'unknown' ? 'unknown' : bimi.bimiRecordStatus.status
          }
          label="BIMI record"
        />
        <StatusPill
          status={bimi.svgStatus.status === 'unknown' ? 'unknown' : bimi.svgStatus.status}
          label="Logo file"
        />
        <StatusPill status={vmcStatus} label="Certificate (VMC/CMC)" />
      </div>
      {showInboxPreview ? <BimiInboxPreview compact={compact} /> : null}
    </div>
  );
}
