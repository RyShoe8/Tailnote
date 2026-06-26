import { CATEGORY_GUIDE } from '@/lib/email-health/categoryGuide';
import { BIMI_WHAT_IS, BIMI_CMC_VMC } from '@/lib/email-health/bimiCopy';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';
import type {
  DnsRecordSuggestion,
  DomainIssue,
  EmailHealthCategory,
} from '@/lib/email-health/types';

export type TrustCenterPillarId = 'deliverability' | 'security' | 'branding';

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
  action?: PillarAction;
  learnContent: string;
  showCertificateLearn?: boolean;
  dnsRecords?: DnsRecordSuggestion[];
  securityIssues?: DomainIssue[];
};

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
  const labels: string[] = [];
  if (!pillarCategoriesNeedAction(scan, ['mx'])) labels.push('mail routing');
  if (!pillarCategoriesNeedAction(scan, ['tls'])) labels.push('encrypted mail delivery');
  if (!pillarCategoriesNeedAction(scan, ['https'])) labels.push('a secure website');
  return labels;
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

function plainIssueSummary(issue: DomainIssue): string {
  return issue.explanation;
}

function buildDeliverabilityLearn(): string {
  return [
    CATEGORY_GUIDE.spf.whatItChecks,
    CATEGORY_GUIDE.mx.whatItChecks,
    CATEGORY_GUIDE.tls.whatItChecks,
    CATEGORY_GUIDE.https.whatItChecks,
  ].join(' ');
}

function buildSecurityLearn(): string {
  return [CATEGORY_GUIDE.dkim.whatItChecks, CATEGORY_GUIDE.dmarc.whatItChecks].join(' ');
}

function buildBrandingLearn(): string {
  return [BIMI_WHAT_IS.body, BIMI_CMC_VMC.intro].join(' ');
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
  const needsAction = pillarCategoriesNeedAction(scan, DELIVERABILITY_CATEGORIES);
  const learnContent = buildDeliverabilityLearn();

  if (!needsAction) {
    return {
      id: 'deliverability',
      status: 'confirmed',
      body: '',
      confirmationLine: 'Your emails are set up to land in the inbox, not spam.',
      learnContent,
    };
  }

  const passing = passingDeliverabilityLabels(scan);
  const spfIssue = primaryIssue(scan, ['spf']) ?? categoryIssues(scan, 'spf')[0];
  const spfDnsRecords = (spfIssue?.dnsRecords ?? []).filter((r) => !r.exampleOnly);

  let fixSentence = 'Your sender policy still needs a quick update so inbox providers trust your mail.';
  if (spfIssue) {
    fixSentence = plainIssueSummary(spfIssue);
  }

  const alreadyFine =
    passing.length > 0
      ? `${passing.join(', ')} ${passing.length === 1 ? 'is' : 'are'} already set up correctly, but `
      : '';

  return {
    id: 'deliverability',
    status: 'needs_action',
    headline: 'Will your emails land in the inbox instead of spam?',
    body: `${alreadyFine}${fixSentence}`,
    action: { label: 'Fix it now', kind: 'spf_fix' },
    learnContent,
    dnsRecords: spfDnsRecords.length > 0 ? spfDnsRecords : undefined,
  };
}

function buildSecurityPillar(scan: SerializedEmailHealthScan): PillarResult {
  const needsAction = pillarCategoriesNeedAction(scan, SECURITY_CATEGORIES);
  const learnContent = buildSecurityLearn();
  const securityIssues = SECURITY_CATEGORIES.flatMap((c) => categoryIssues(scan, c));

  if (!needsAction) {
    return {
      id: 'security',
      status: 'confirmed',
      body: '',
      confirmationLine: "Scammers can't easily send fake emails that look like they're from you.",
      learnContent,
    };
  }

  const dkimOk = !pillarCategoriesNeedAction(scan, ['dkim']);
  const dmarcOk = !pillarCategoriesNeedAction(scan, ['dmarc']);
  const parts: string[] = [];
  if (dkimOk) parts.push('message signing is in place');
  if (dmarcOk) parts.push('you have an enforcement policy');

  let missing = 'signing and enforcement still need to be finished.';
  const primary = primaryIssue(scan, SECURITY_CATEGORIES);
  if (primary) {
    missing = plainIssueSummary(primary);
  } else if (!dkimOk && dmarcOk) {
    missing = 'message signing is not set up yet.';
  } else if (dkimOk && !dmarcOk) {
    missing = 'you do not have an enforcement policy yet.';
  }

  const alreadyFine = parts.length > 0 ? `${parts.join(' and ')}, but ` : '';

  return {
    id: 'security',
    status: 'needs_action',
    headline: "Can people tell a fake email isn't really from you?",
    body: `${alreadyFine}${missing}`,
    action: { label: 'Fix it now', kind: 'security_fix' },
    learnContent,
    securityIssues,
  };
}

function buildBrandingPillar(
  scan: SerializedEmailHealthScan,
  bimi: TrustCenterBimiState,
): PillarResult {
  const learnContent = buildBrandingLearn();
  const needsAction = brandingNeedsAction(scan, bimi);

  if (!needsAction) {
    const providerNote = scan.bimiDetail
      ? ' Yahoo and Fastmail are more likely to show your logo with your current setup.'
      : '';
    return {
      id: 'branding',
      status: 'confirmed',
      body: '',
      confirmationLine: `Your logo is set up to show in supporting inboxes.${providerNote}`,
      learnContent,
      showCertificateLearn: true,
    };
  }

  if (!bimi.canUseBimiLogoHosting) {
    return {
      id: 'branding',
      status: 'needs_action',
      headline: 'Want your logo to show up next to your emails in Gmail and other inboxes?',
      body: "Nothing's set up yet. Upgrade to a paid plan to upload your logo, get the one DNS record we generate, add it, and rescan.",
      action: { label: 'See plans', kind: 'upgrade' },
      learnContent,
      showCertificateLearn: true,
    };
  }

  if (!bimi.bimiLogoUrl.trim()) {
    return {
      id: 'branding',
      status: 'needs_action',
      headline: 'Want your logo to show up next to your emails in Gmail and other inboxes?',
      body: "Nothing's set up yet. Here's everything you can do for free: upload your logo, we'll generate the one DNS record you need, then add it and rescan.",
      action: { label: 'Set it up free', kind: 'branding_setup' },
      learnContent,
      showCertificateLearn: true,
    };
  }

  return {
    id: 'branding',
    status: 'needs_action',
    headline: 'Want your logo to show up next to your emails in Gmail and other inboxes?',
    body: 'Your logo is hosted. Add the DNS record below at your provider, then rescan to confirm your logo can show in supporting inboxes.',
    action: { label: 'Set it up free', kind: 'branding_setup' },
    learnContent,
    showCertificateLearn: true,
  };
}

export function buildTrustCenterSummary(pillars: PillarResult[]): string {
  const n = pillars.filter((p) => p.status === 'needs_action').length;
  if (n === 0) {
    return 'Great news — deliverability, security, and branding are all in good shape for your domain.';
  }
  return `Good news — most things are already working. ${n} area${n === 1 ? '' : 's'} need${n === 1 ? 's' : ''} a quick look.`;
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
  const text = [pillar.headline, pillar.body, pillar.confirmationLine].filter(Boolean).join(' ');
  return !ACRONYM_PATTERN.test(text);
}
