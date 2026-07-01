'use client';

import { Inbox, Palette, Shield } from 'lucide-react';
import {
  TRUST_CENTER_SCAN_EXPLAINER,
  TRUST_CENTER_SCAN_EXPLAINER_COMPACT,
  type TrustCenterPillarId,
} from '@/lib/brandTrust/trustCenterCopy';
import { ScanCheckRow, type ScanCheckRowAccent } from '@/components/brand-trust/trust-center/ScanCheckRow';

const PILLAR_STYLES: Record<
  TrustCenterPillarId,
  {
    icon: typeof Inbox;
    badge: string;
    iconColor: string;
    gradient: string;
    accent: ScanCheckRowAccent;
  }
> = {
  deliverability: {
    icon: Inbox,
    badge: 'bg-emerald-100 text-emerald-700',
    iconColor: 'text-emerald-600',
    gradient: 'from-emerald-500/10 to-teal-500/10 border-emerald-200/60',
    accent: 'emerald',
  },
  security: {
    icon: Shield,
    badge: 'bg-blue-100 text-blue-700',
    iconColor: 'text-blue-600',
    gradient: 'from-blue-500/10 to-cyan-500/10 border-blue-200/60',
    accent: 'blue',
  },
  branding: {
    icon: Palette,
    badge: 'bg-amber-100 text-amber-800',
    iconColor: 'text-amber-700',
    gradient: 'from-amber-500/10 to-orange-500/10 border-amber-200/60',
    accent: 'amber',
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
      <div className="grid gap-4 lg:grid-cols-3">
        {TRUST_CENTER_SCAN_EXPLAINER.map((pillar) => {
          const style = PILLAR_STYLES[pillar.id];
          const Icon = style.icon;
          return (
            <div
              key={pillar.id}
              className={`flex flex-col rounded-2xl border bg-gradient-to-br p-5 shadow-card ${style.gradient}`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${style.badge}`}
                >
                  <Icon className={`h-5 w-5 ${style.iconColor}`} aria-hidden />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {pillar.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{pillar.promise}</p>
              </div>
              <ul className="mt-4 space-y-3">
                {pillar.checks.map((check) => (
                  <li key={check.label}>
                    <ScanCheckRow
                      label={check.label}
                      solution={check.solution}
                      accent={style.accent}
                    />
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
