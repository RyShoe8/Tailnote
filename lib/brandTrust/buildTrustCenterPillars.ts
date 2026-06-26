import {
  TRUST_CENTER_LEARN,
  TRUST_CENTER_PILLAR_COPY,
  TRUST_CENTER_SUMMARY,
  deliverabilityPartialBody,
  securityPartialBody,
  type TrustCenterLearnSection,
  type TrustCenterPillarId,
} from '@/lib/brandTrust/trustCenterCopy';
import { plainFixPhrase, plainIssueForTrustCenter } from '@/lib/brandTrust/plainIssueForTrustCenter';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';
import type {
  DnsRecordSuggestion,
  DomainIssue,
  EmailHealthCategory,
} from '@/lib/email-health/types';

export type { TrustCenterPillarId, TrustCenterLearnSection };

export const TRUST_CENTER_PILLAR_ORDER: readonly TrustCenterPillarId[] = [
  'deliverability',
  'security',
  'branding',
] as const;

export type TrustCenterBimiState = {
  canUseBimiLogoHosting: boolean;
  bimiLogoUrl: string;
  bimiSuggestedRecord: string;
};

export type PillarAction = {
  label: string;
  kind: 'spf_fix' | 'security_fix' | 'branding_setup' | 'upgrade';
};

export type PillarResult = {
  id: TrustCenterPillarId;
  status: 'confirmed' | 'needs_action';
  headline?: string;
  body: string;
  confirmationLine?: string;
  confirmationNote?: string;
  action?: PillarAction;
  learnSections: TrustCenterLearnSection[];
  showCertificateLearn?: boolean;
  dnsRecords?: DnsRecordSuggestion[];
  deliverabilityIssues?: DomainIssue[];
  securityIssues?: DomainIssue[];
  fixIntro?: string;
};

function aggregateDnsRecords(issues: DomainIssue[]): DnsRecordSuggestion[] {
  const seen = new Set<string>();
  const records: DnsRecordSuggestion[] = [];
  for (const issue of issues) {
    for (const rec of issue.dnsRecords ?? []) {
      if (rec.exampleOnly) continue;
      const key = `${rec.type}|${rec.host}|${rec.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      records.push(rec);
    }
  }
  return records;
}

const DELIVERABILITY_CATEGORIES: EmailHealthCategory[] = ['spf', 'mx', 'tls', 'https'];
const SECURITY_CATEGORIES: EmailHealthCategory[] = ['dkim', 'dmarc'];

const ACRONYM_PATTERN = /\b(SPF|DKIM|DMARC|BIMI|CMC|VMC|MX|TLS|HTTPS)\b/i;

function categoryResult(scan: SerializedEmailHealthScan, category: EmailHealthCategory) {
  return scan.categories.find((c) => c.category === category);
}

function categoryIssues(scan: SerializedEmailHealthScan, category: EmailHealthCategory) {
  return scan.issues.filter(
    (i) => i.category === category && (i.severity === 'fail' || i.severity === 'warn'),
  );
}

function pillarCategoriesNeedAction(
  scan: SerializedEmailHealthScan,
  categories: EmailHealthCategory[],
): boolean {
  for (const category of categories) {
    const result = categoryResult(scan, category);
    if (result && (result.status === 'warn' || result.status === 'fail')) return true;
    if (categoryIssues(scan, category).length > 0) return true;
  }
  return false;
}

function passingDeliverabilityLabels(scan: SerializedEmailHealthScan): string[] {
  const labels = TRUST_CENTER_PILLAR_COPY.deliverability.passingLabels;
  const passing: string[] = [];
  if (!pillarCategoriesNeedAction(scan, ['mx'])) passing.push(labels.mx);
  if (!pillarCategoriesNeedAction(scan, ['tls'])) passing.push(labels.tls);
  if (!pillarCategoriesNeedAction(scan, ['https'])) passing.push(labels.https);
  return passing;
}

function primaryIssue(
  scan: SerializedEmailHealthScan,
  categories: EmailHealthCategory[],
): DomainIssue | undefined {
  const severityOrder = { fail: 0, warn: 1, info: 2 } as const;
  return scan.issues
    .filter((i) => categories.includes(i.category) && (i.severity === 'fail' || i.severity === 'warn'))
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])[0];
}

function brandingNeedsAction(
  scan: SerializedEmailHealthScan,
  bimi: TrustCenterBimiState,
): boolean {
  if (!bimi.canUseBimiLogoHosting) return true;
  if (!bimi.bimiLogoUrl.trim()) return true;
  const bimiResult = categoryResult(scan, 'bimi');
  if (bimiResult && (bimiResult.status === 'warn' || bimiResult.status === 'fail')) return true;
  if (categoryIssues(scan, 'bimi').length > 0) return true;
  return false;
}

function buildDeliverabilityPillar(scan: SerializedEmailHealthScan): PillarResult {
  const copy = TRUST_CENTER_PILLAR_COPY.deliverability;
  const needsAction = pillarCategoriesNeedAction(scan, DELIVERABILITY_CATEGORIES);

  if (!needsAction) {
    return {
      id: 'deliverability',
      status: 'confirmed',
      body: '',
      confirmationLine: copy.confirmed,
      learnSections: TRUST_CENTER_LEARN.deliverability,
    };
  }

  const passing = passingDeliverabilityLabels(scan);
  const deliverabilityIssues = DELIVERABILITY_CATEGORIES.flatMap((c) => categoryIssues(scan, c));
  const primary = primaryIssue(scan, DELIVERABILITY_CATEGORIES);
  const allDnsRecords = aggregateDnsRecords(deliverabilityIssues);
  const fixPhrase = plainFixPhrase(primary, copy.defaultFix);

  return {
    id: 'deliverability',
    status: 'needs_action',
    headline: copy.headline,
    body: deliverabilityPartialBody(passing, fixPhrase),
    action: { label: copy.actionLabel, kind: 'spf_fix' },
    learnSections: TRUST_CENTER_LEARN.deliverability,
    deliverabilityIssues: deliverabilityIssues.length > 0 ? deliverabilityIssues : undefined,
    dnsRecords: allDnsRecords.length > 0 ? allDnsRecords : undefined,
    fixIntro: copy.fixIntro,
  };
}

function buildSecurityPillar(scan: SerializedEmailHealthScan): PillarResult {
  const copy = TRUST_CENTER_PILLAR_COPY.security;
  const needsAction = pillarCategoriesNeedAction(scan, SECURITY_CATEGORIES);
  const securityIssues = SECURITY_CATEGORIES.flatMap((c) => categoryIssues(scan, c));

  if (!needsAction) {
    return {
      id: 'security',
      status: 'confirmed',
      body: '',
      confirmationLine: copy.confirmed,
      learnSections: TRUST_CENTER_LEARN.security,
    };
  }

  const working: string[] = [];
  if (!pillarCategoriesNeedAction(scan, ['dkim'])) working.push(copy.working.dkim);
  if (!pillarCategoriesNeedAction(scan, ['dmarc'])) working.push(copy.working.dmarc);

  const primary = primaryIssue(scan, SECURITY_CATEGORIES);
  const fixPhrase = plainFixPhrase(primary, copy.defaultFix);

  return {
    id: 'security',
    status: 'needs_action',
    headline: copy.headline,
    body: securityPartialBody(working, fixPhrase),
    action: { label: copy.actionLabel, kind: 'security_fix' },
    learnSections: TRUST_CENTER_LEARN.security,
    securityIssues,
  };
}

function buildBrandingPillar(
  scan: SerializedEmailHealthScan,
  bimi: TrustCenterBimiState,
): PillarResult {
  const copy = TRUST_CENTER_PILLAR_COPY.branding;
  const needsAction = brandingNeedsAction(scan, bimi);

  if (!needsAction) {
    return {
      id: 'branding',
      status: 'confirmed',
      body: '',
      confirmationLine: copy.confirmed,
      confirmationNote: scan.bimiDetail ? copy.confirmedProviderNote : undefined,
      learnSections: TRUST_CENTER_LEARN.branding,
      showCertificateLearn: true,
    };
  }

  if (!bimi.canUseBimiLogoHosting) {
    return {
      id: 'branding',
      status: 'needs_action',
      headline: copy.headline,
      body: copy.notOnPlan,
      action: { label: copy.upgradeLabel, kind: 'upgrade' },
      learnSections: TRUST_CENTER_LEARN.branding,
      showCertificateLearn: true,
    };
  }

  if (!bimi.bimiLogoUrl.trim()) {
    return {
      id: 'branding',
      status: 'needs_action',
      headline: copy.headline,
      body: copy.notUploaded,
      action: { label: copy.actionLabel, kind: 'branding_setup' },
      learnSections: TRUST_CENTER_LEARN.branding,
      showCertificateLearn: true,
    };
  }

  return {
    id: 'branding',
    status: 'needs_action',
    headline: copy.headline,
    body: copy.uploadedPending,
    action: { label: copy.actionLabel, kind: 'branding_setup' },
    learnSections: TRUST_CENTER_LEARN.branding,
    showCertificateLearn: true,
  };
}

export function buildTrustCenterSummary(pillars: PillarResult[]): string {
  const n = pillars.filter((p) => p.status === 'needs_action').length;
  if (n === 0) return TRUST_CENTER_SUMMARY.allGood;
  return TRUST_CENTER_SUMMARY.partial(n);
}

export function buildTrustCenterPillars(
  scan: SerializedEmailHealthScan,
  bimi: TrustCenterBimiState,
): PillarResult[] {
  return [
    buildDeliverabilityPillar(scan),
    buildSecurityPillar(scan),
    buildBrandingPillar(scan, bimi),
  ];
}

/** Test helper: card copy must stay plain English (no acronyms outside learn expanders). */
export function pillarCardCopyIsPlainEnglish(pillar: PillarResult): boolean {
  const text = [pillar.headline, pillar.body, pillar.confirmationLine, pillar.confirmationNote]
    .filter(Boolean)
    .join(' ');
  return !ACRONYM_PATTERN.test(text);
}
