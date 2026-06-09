import { BIMI_INBOX_PREVIEW } from '@/lib/email-health/bimiCopy';
import { cn } from '@/lib/utils';

const DEFAULT_ACCENT = '#0065c9';

export type BimiInboxPreviewProps = {
  compact?: boolean;
  accentColor?: string;
  showVerifiedBadge?: boolean;
  senderName?: string;
  subject?: string;
  preview?: string;
};

function VerifiedBadge({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={cn('shrink-0 text-[#1a73e8]', className)}
      fill="currentColor"
    >
      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm3.78 5.47-4.2 4.2a.75.75 0 0 1-1.06 0L4.22 7.37a.75.75 0 1 1 1.06-1.06l1.72 1.72 3.67-3.67a.75.75 0 1 1 1.11 1.01Z" />
    </svg>
  );
}

export function BimiInboxPreview({
  compact = false,
  accentColor = DEFAULT_ACCENT,
  showVerifiedBadge = false,
  senderName = BIMI_INBOX_PREVIEW.senderName,
  subject = BIMI_INBOX_PREVIEW.subject,
  preview = BIMI_INBOX_PREVIEW.preview,
}: BimiInboxPreviewProps) {
  const avatarSize = compact ? 'h-9 w-9' : 'h-11 w-11';
  const logoTextSize = compact ? 'text-[7px] leading-tight' : 'text-[8px] leading-tight';

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 sm:p-4">
      <div
        className={cn(
          'flex items-start gap-3 rounded-md border border-border/50 bg-background px-3 py-2.5 shadow-sm',
          compact && 'gap-2.5 px-2.5 py-2',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full text-center font-semibold text-white',
            avatarSize,
            logoTextSize,
          )}
          style={{ backgroundColor: accentColor }}
          aria-hidden
        >
          <span className="max-w-[2.5rem] px-0.5">Your Logo</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={cn('truncate font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>
              {senderName}
            </p>
            {showVerifiedBadge ? <VerifiedBadge className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> : null}
          </div>
          <p className={cn('truncate text-foreground/90', compact ? 'text-xs' : 'text-sm')}>{subject}</p>
          <p className={cn('truncate text-muted-foreground', compact ? 'text-[11px]' : 'text-xs')}>{preview}</p>
        </div>
      </div>
      <p className={cn('mt-2 text-muted-foreground', compact ? 'text-[11px]' : 'text-xs')}>
        {BIMI_INBOX_PREVIEW.caption}
      </p>
    </div>
  );
}
