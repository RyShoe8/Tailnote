import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ScanCheckRowAccent = 'emerald' | 'blue' | 'amber';

const ACCENT_STYLES: Record<
  ScanCheckRowAccent,
  { callout: string; border: string; icon: string }
> = {
  emerald: {
    callout: 'bg-emerald-50/90',
    border: 'border-emerald-400',
    icon: 'text-emerald-600',
  },
  blue: {
    callout: 'bg-blue-50/90',
    border: 'border-blue-400',
    icon: 'text-blue-600',
  },
  amber: {
    callout: 'bg-amber-50/90',
    border: 'border-amber-400',
    icon: 'text-amber-600',
  },
};

type Props = {
  label: string;
  solution: string;
  accent?: ScanCheckRowAccent;
  icon?: ReactNode;
};

export function ScanCheckRow({ label, solution, accent = 'blue', icon }: Props) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div className="rounded-xl border border-border/70 bg-white/80 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        What we check
      </p>
      <div className="mt-1 flex items-start gap-2">
        {icon ? (
          <span className={cn('mt-0.5 shrink-0', styles.icon)} aria-hidden>
            {icon}
          </span>
        ) : null}
        <p className="text-sm font-semibold text-foreground">{label}</p>
      </div>
      <div
        className={cn(
          'mt-3 rounded-lg border-l-4 px-3 py-2.5',
          styles.callout,
          styles.border,
        )}
      >
        <div className="flex items-start gap-2">
          <Sparkles className={cn('mt-0.5 h-4 w-4 shrink-0', styles.icon)} aria-hidden />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
              How we solve it
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{solution}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
