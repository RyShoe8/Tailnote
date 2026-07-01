'use client';

import { AlertCircle, GripVertical, Info } from 'lucide-react';
import type { DragDropStatusResult } from '@/lib/signature/dragDropStatus';
import { cn } from '@/lib/utils';

type Props = {
  status: DragDropStatusResult | null;
};

const VARIANT_STYLES: Record<DragDropStatusResult['variant'], string> = {
  info: 'border-primary/25 bg-primary/5 text-foreground',
  active: 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/20',
  warning: 'border-destructive/30 bg-destructive/5 text-destructive',
  muted: 'border-border bg-muted/40 text-muted-foreground',
};

export function SignatureDragStatusBar({ status }: Props) {
  if (!status) return null;

  const Icon =
    status.variant === 'warning' ? AlertCircle : status.variant === 'active' ? GripVertical : Info;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
        VARIANT_STYLES[status.variant],
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
      <span>{status.message}</span>
    </div>
  );
}
