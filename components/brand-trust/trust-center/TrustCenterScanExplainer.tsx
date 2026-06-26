'use client';

import { Check, Inbox, Palette, Shield } from 'lucide-react';
import {
  TRUST_CENTER_SCAN_EXPLAINER,
  TRUST_CENTER_SCAN_EXPLAINER_COMPACT,
  type TrustCenterPillarId,
} from '@/lib/brandTrust/trustCenterCopy';

const PILLAR_STYLES: Record<
  TrustCenterPillarId,
  { icon: typeof Inbox; badge: string; iconColor: string }
> = {
  deliverability: {
    icon: Inbox,
    badge: 'bg-emerald-100 text-emerald-700',
    iconColor: 'text-emerald-600',
  },
  security: {
    icon: Shield,
    badge: 'bg-blue-100 text-blue-700',
    iconColor: 'text-blue-600',
  },
  branding: {
    icon: Palette,
    badge: 'bg-amber-100 text-amber-800',
    iconColor: 'text-amber-700',
  },
};

type Props = {
  variant?: 'full' | 'compact';
};

export function TrustCenterScanExplainer({ variant = 'full' }: Props) {
  if (variant === 'compact') {
    return (
      <p className="text-sm text-muted-foreground">{TRUST_CENTER_SCAN_EXPLAINER_COMPACT}</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm font-medium text-foreground">What we check</p>
      <div className="grid gap-4 lg:grid-cols-3">
        {TRUST_CENTER_SCAN_EXPLAINER.map((pillar) => {
          const style = PILLAR_STYLES[pillar.id];
          const Icon = style.icon;
          return (
            <div
              key={pillar.id}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-ring"
            >
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${style.badge}`}
              >
                <Icon className={`h-5 w-5 ${style.iconColor}`} aria-hidden />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">{pillar.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{pillar.promise}</p>
              <ul className="mt-4 space-y-2">
                {pillar.checks.map((check) => (
                  <li key={check} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconColor}`}
                      aria-hidden
                    />
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
