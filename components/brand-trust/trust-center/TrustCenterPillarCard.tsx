'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Shield, Mail, Badge, Lock, Globe, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DnsRecordCopy } from '@/components/email-health/DnsRecordCopy';
import { TrustCenterSecurityFix } from '@/components/brand-trust/trust-center/TrustCenterSecurityFix';
import { TrustCenterBrandingAction } from '@/components/brand-trust/trust-center/TrustCenterBrandingAction';
import { TrustCenterLearnMore } from '@/components/brand-trust/trust-center/TrustCenterLearnMore';
import { DASHBOARD_UPGRADE_HREF } from '@/lib/billing/upgradeLinks';
import type { PillarResult } from '@/lib/brandTrust/buildTrustCenterPillars';

const PILLAR_ICONS: Record<string, React.ReactNode> = {
  deliverability: <Mail className="h-5 w-5" />,
  security: <Shield className="h-5 w-5" />,
  branding: <Badge className="h-5 w-5" />,
};

const PILLAR_GRADIENTS: Record<string, string> = {
  deliverability: 'from-blue-500/10 to-cyan-500/10 border-blue-200/60',
  security: 'from-emerald-500/10 to-teal-500/10 border-emerald-200/60',
  branding: 'from-amber-500/10 to-orange-500/10 border-amber-200/60',
};

const PILLAR_ICON_COLORS: Record<string, string> = {
  deliverability: 'text-blue-600 bg-blue-100',
  security: 'text-emerald-600 bg-emerald-100',
  branding: 'text-amber-600 bg-amber-100',
};

type Props = {
  pillar: PillarResult;
  domain: string;
  canUseBimiLogoHosting: boolean;
  bimiLogoUrl: string;
  bimiSuggestedRecord: string;
  onBimiUploaded?: (payload: { url: string; suggestedRecord: string }) => void;
  onAction?: () => void;
  upgradeHref?: string;
};

function BodyText({ text }: { text: string }) {
  const lines = text.split('\n').filter(Boolean);
  if (lines.length <= 1) {
    return <p className="mt-2 text-sm text-muted-foreground">{text}</p>;
  }
  return (
    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

export function TrustCenterPillarCard({
  pillar,
  domain,
  canUseBimiLogoHosting,
  bimiLogoUrl,
  bimiSuggestedRecord,
  onBimiUploaded,
  onAction,
  upgradeHref = DASHBOARD_UPGRADE_HREF,
}: Props) {
  const [showFix, setShowFix] = useState(false);
  const fixPanelRef = useRef<HTMLDivElement>(null);

  if (pillar.status === 'confirmed') {
    const iconBg = PILLAR_ICON_COLORS[pillar.id] || 'text-emerald-600 bg-emerald-100';
    const gradient = PILLAR_GRADIENTS[pillar.id] || 'from-emerald-500/10 to-teal-500/10 border-emerald-200/60';
    const icon = PILLAR_ICONS[pillar.id] || <CheckCircle2 className="h-5 w-5" />;

    return (
      <div className={`flex gap-4 rounded-xl border bg-gradient-to-br p-6 ${gradient}`}>
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-base font-semibold text-foreground">{pillar.headline}</p>
            <p className="mt-1 text-sm font-medium text-foreground">{pillar.confirmationLine}</p>
          </div>
          {pillar.confirmationNote ? (
            <p className="text-sm text-muted-foreground">{pillar.confirmationNote}</p>
          ) : null}
          <TrustCenterLearnMore
            sections={pillar.learnSections}
            showCertificateLearn={pillar.showCertificateLearn}
          />
        </div>
      </div>
    );
  }

  const isBranding = pillar.id === 'branding';
  const showActionButton =
    pillar.action &&
    (pillar.action.kind === 'upgrade' || pillar.action.kind === 'signup' || !showFix);

  const gradient = PILLAR_GRADIENTS[pillar.id] || 'from-amber-500/10 to-orange-500/10 border-amber-200/60';
  const iconBg = PILLAR_ICON_COLORS[pillar.id] || 'text-amber-600 bg-amber-100';
  const icon = PILLAR_ICONS[pillar.id] || <AlertTriangle className="h-5 w-5" />;

  function openFixPanel() {
    setShowFix(true);
    onAction?.();
    requestAnimationFrame(() => {
      fixPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  return (
    <article
      className={`rounded-xl border bg-gradient-to-br p-6 shadow-card ${gradient}`}
    >
      <div className="flex gap-4">
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-foreground">{pillar.headline}</h3>
          <BodyText text={pillar.body} />
        </div>
      </div>

      {showActionButton ? (
        <div className="mt-4">
          {pillar.action!.kind === 'upgrade' ? (
            <Button asChild size="sm">
              <Link href={upgradeHref}>{pillar.action!.label}</Link>
            </Button>
          ) : pillar.action!.kind === 'signup' ? (
            <Button asChild size="sm">
              <Link href="/signup">{pillar.action!.label}</Link>
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={openFixPanel}>
              {pillar.action!.label}
            </Button>
          )}
        </div>
      ) : null}

      {showFix && pillar.id === 'deliverability' ? (
        <div ref={fixPanelRef} className="mt-4 space-y-3">
          {pillar.deliverabilityIssues?.length ? (
            <TrustCenterSecurityFix issues={pillar.deliverabilityIssues} zoneDomain={domain} />
          ) : pillar.dnsRecords?.length ? (
            <>
              {pillar.fixIntro ? (
                <p className="text-sm text-muted-foreground">{pillar.fixIntro}</p>
              ) : null}
              {pillar.dnsRecords.map((rec) => (
                <DnsRecordCopy key={`${rec.type}-${rec.host}`} record={rec} zoneDomain={domain} />
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Review the guidance above, make the recommended changes at your DNS or email provider,
              then rescan to confirm.
            </p>
          )}
        </div>
      ) : null}

      {showFix && pillar.id === 'security' && pillar.securityIssues?.length ? (
        <div ref={fixPanelRef}>
          <TrustCenterSecurityFix issues={pillar.securityIssues} zoneDomain={domain} />
        </div>
      ) : null}

      {showFix && pillar.id === 'branding' && pillar.action?.kind === 'branding_setup' ? (
        <div ref={fixPanelRef} className="mt-4 space-y-4">
          {pillar.fixIntro ? (
            <p className="text-sm text-muted-foreground">{pillar.fixIntro}</p>
          ) : null}
          {pillar.brandingIssues?.length ? (
            <TrustCenterSecurityFix issues={pillar.brandingIssues} zoneDomain={domain} />
          ) : pillar.dnsRecords?.length ? (
            pillar.dnsRecords.map((rec) => (
              <DnsRecordCopy key={`${rec.type}-${rec.host}`} record={rec} zoneDomain={domain} />
            ))
          ) : null}
          {pillar.brandingNeedsUpload || !bimiLogoUrl.trim() ? (
            <TrustCenterBrandingAction
              canUseBimiLogoHosting={canUseBimiLogoHosting}
              bimiLogoUrl={bimiLogoUrl}
              bimiSuggestedRecord={bimiSuggestedRecord}
              onUploaded={onBimiUploaded}
              upgradeHref={upgradeHref}
            />
          ) : null}
        </div>
      ) : null}

      <div className="mt-4">
        <TrustCenterLearnMore
          sections={pillar.learnSections}
          showCertificateLearn={pillar.showCertificateLearn}
        />
      </div>
    </article>
  );
}
