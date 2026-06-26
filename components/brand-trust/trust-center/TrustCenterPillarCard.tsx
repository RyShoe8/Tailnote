'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DnsRecordCopy } from '@/components/email-health/DnsRecordCopy';
import { TrustCenterSecurityFix } from '@/components/brand-trust/trust-center/TrustCenterSecurityFix';
import { TrustCenterBrandingAction } from '@/components/brand-trust/trust-center/TrustCenterBrandingAction';
import { TrustCenterLearnMore } from '@/components/brand-trust/trust-center/TrustCenterLearnMore';
import { DASHBOARD_UPGRADE_HREF } from '@/lib/billing/upgradeLinks';
import type { PillarResult } from '@/lib/brandTrust/buildTrustCenterPillars';

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
    return (
      <div className="flex gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        <div className="min-w-0 space-y-3">
          <p className="text-sm font-medium text-foreground">{pillar.confirmationLine}</p>
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
  const showActionButton = pillar.action && (pillar.action.kind === 'upgrade' || !showFix);

  function openFixPanel() {
    setShowFix(true);
    onAction?.();
    requestAnimationFrame(() => {
      fixPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  return (
    <article
      className={`rounded-xl border p-5 shadow-card ${
        isBranding
          ? 'border-amber-200/80 bg-amber-50/30'
          : 'border-amber-200/80 bg-amber-50/40'
      }`}
    >
      <h3 className="text-base font-semibold tracking-tight text-foreground">{pillar.headline}</h3>
      <BodyText text={pillar.body} />

      {showActionButton ? (
        <div className="mt-4">
          {pillar.action!.kind === 'upgrade' ? (
            <Button asChild size="sm">
              <Link href={upgradeHref}>{pillar.action!.label}</Link>
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
        <div ref={fixPanelRef} className="mt-4">
          <TrustCenterBrandingAction
            canUseBimiLogoHosting={canUseBimiLogoHosting}
            bimiLogoUrl={bimiLogoUrl}
            bimiSuggestedRecord={bimiSuggestedRecord}
            onUploaded={onBimiUploaded}
            upgradeHref={upgradeHref}
          />
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
