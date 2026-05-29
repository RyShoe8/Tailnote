'use client';

import { Info, Lightbulb, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type CalloutProps = {
  variant?: 'info' | 'tip' | 'warning';
  title?: string;
  children: React.ReactNode;
};

const CALLOUT_STYLES = {
  info: {
    border: 'border-l-primary',
    bg: 'bg-primary/5',
    icon: Info,
    iconClass: 'text-primary',
  },
  tip: {
    border: 'border-l-[#4fd6b2]',
    bg: 'bg-[#4fd6b2]/10',
    icon: Lightbulb,
    iconClass: 'text-[#0c8fa3]',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
  },
} as const;

export function Callout({ variant = 'info', title, children }: CalloutProps) {
  const style = CALLOUT_STYLES[variant];
  const Icon = style.icon;

  return (
    <aside
      className={cn(
        'my-8 rounded-xl border border-slate-200/80 border-l-4 p-5 not-prose',
        style.border,
        style.bg
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.iconClass)} aria-hidden />
        <div className="min-w-0">
          {title ? <p className="mb-1 font-semibold text-foreground">{title}</p> : null}
          <div className="text-sm leading-relaxed text-muted-foreground [&>p]:mt-0">{children}</div>
        </div>
      </div>
    </aside>
  );
}
