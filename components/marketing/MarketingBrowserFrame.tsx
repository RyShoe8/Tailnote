import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  url?: string;
  className?: string;
  contentClassName?: string;
};

export function MarketingBrowserFrame({
  children,
  url = 'app.tailnote.com/dashboard',
  className,
  contentClassName,
}: Props) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-ring ring-1 ring-slate-900/5 sm:rounded-3xl',
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/90 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
        </div>
        <p className="min-w-0 flex-1 truncate rounded-md border border-slate-200/80 bg-white px-2.5 py-1 text-center text-[11px] text-slate-500 sm:text-xs">
          {url}
        </p>
      </div>
      <div className={cn('bg-slate-50/40 p-3 sm:p-4', contentClassName)}>{children}</div>
    </div>
  );
}
