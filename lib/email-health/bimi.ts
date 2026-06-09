import { flattenTxt, resolveTxtRecords } from '@/lib/email-health/dns';
import {
  fetchDmarcRecord,
  getDmarcEligibilityForBimi,
  type DmarcBimiEligibility,
  type DmarcParsed,
} from '@/lib/email-health/dmarc';
import { analyzeBimiCertificate, type CertificateAnalysis } from '@/lib/email-health/certificates';
import { validateBimiSvgUrl, type SvgValidationResult } from '@/lib/email-health/svg';
import { BIMI_IMPLEMENTATION_STEPS, BIMI_PLACEHOLDER_SVG_NOTE, PAID_BIMI_HOSTING_CTA } from '@/lib/email-health/bimiCopy';
import {
  exampleBimiHost,
  exampleBimiRecordValue,
  missingBimiTechnicalDetail,
} from '@/lib/email-health/bimiDnsExample';
import type { BIMIResult, BimiIssue, ProviderReadinessStatus } from '@/lib/email-health/bimiTypes';
import type { CategoryResult, CheckStatus, DomainIssue } from '@/lib/email-health/types';
import { buildCategoryResult } from '@/lib/email-health/scoring';

export type { BIMIResult, BimiIssue, ProviderReadinessStatus } from '@/lib/email-health/bimiTypes';
export { vmcStatusFromResult } from '@/lib/email-health/bimiTypes';

function parseBimiTags(record: string): { v?: string; l?: string; a?: string } {
  const v = record.match(/(?:^|;)\s*v\s*=\s*([^;]+)/i)?.[1]?.trim();
  const l = record.match(/(?:^|;)\s*l\s*=\s*([^;]+)/i)?.[1]?.trim();
  const a = record.match(/(?:^|;)\s*a\s*=\s*([^;]+)/i)?.[1]?.trim();
  return { v, l, a };
}

function computeProviderReadiness(args: {
  dmarc: DmarcBimiEligibility;
  hasBimiRecord: boolean;
  svg: SvgValidationResult;
  cert: CertificateAnalysis;
}): BIMIResult['providerReadiness'] {
  const { dmarc, hasBimiRecord, svg, cert } = args;

  function gmail(): ProviderReadinessStatus {
    if (!dmarc.eligibleForBimi || !hasBimiRecord) return 'fail';
    if (svg.status === 'fail') return 'fail';
    if (cert.classification === 'vmc_likely' && dmarc.status === 'pass' && svg.status === 'pass') {
      return 'pass';
    }
    if (cert.classification === 'none' || cert.classification === 'self_asserted') return 'warn';
    return 'warn';
  }

  function yahoo(): ProviderReadinessStatus {
    if (!dmarc.eligibleForBimi || !hasBimiRecord) return 'fail';
    if (svg.status === 'fail') return 'fail';
    if (svg.status === 'pass' && dmarc.status !== 'fail') return 'pass';
    return 'warn';
  }

  function fastmail(): ProviderReadinessStatus {
    if (!dmarc.eligibleForBimi || !hasBimiRecord) return 'fail';
    if (svg.status === 'fail') return 'fail';
    if (svg.status === 'pass') return 'warn';
    return 'unknown';
  }

  return { gmail: gmail(), yahoo: yahoo(), fastmail: fastmail() };
}

function overallStatus(parts: CheckStatus[]): CheckStatus | 'unknown' {
  if (parts.includes('fail')) return 'fail';
  if (parts.includes('warn')) return 'warn';
  if (parts.every((p) => p === 'pass')) return 'pass';
  return 'unknown';
}

export type AnalyzeBimiOptions = {
  dmarcParsed?: DmarcParsed | null;
};

export async function analyzeBimi(domain: string, options?: AnalyzeBimiOptions): Promise<BIMIResult> {
  const issues: BimiIssue[] = [];
  const recommendations: string[] = [];

  const dmarcParsed = options?.dmarcParsed ?? (await fetchDmarcRecord(domain));
  const dmarcStatus = getDmarcEligibilityForBimi(dmarcParsed);

  if (!dmarcStatus.eligibleForBimi) {
    issues.push({
      title: 'Stronger email protection is needed before BIMI',
      plainEnglishExplanation:
        'BIMI needs stronger email protection before mailbox providers will trust your logo.',
      technicalDetail: dmarcStatus.record
        ? `DMARC policy: ${dmarcStatus.policy ?? 'unknown'}`
        : 'No DMARC record found',
      severity: 'fail',
      howToFix:
        'Move DMARC to quarantine or reject after legitimate mail passes SPF and DKIM, then rescan.',
    });
    recommendations.push('Fix DMARC first — BIMI depends on it.');
  }

  const host = `default._bimi.${domain}`;
  const txt = flattenTxt(await resolveTxtRecords(host));
  const bimiRecord = txt.find((r) => r.toLowerCase().startsWith('v=bimi1'));
  const tags = bimiRecord ? parseBimiTags(bimiRecord) : {};

  let bimiRecordStatus: BIMIResult['bimiRecordStatus'];
  if (!bimiRecord) {
    bimiRecordStatus = {
      status: 'fail',
      tags: {},
      summary: 'Your domain is not yet set up to show a verified brand logo in supporting inboxes',
    };
    issues.push({
      title: 'Brand logo setup is missing',
      plainEnglishExplanation:
        'Your domain is not yet set up to show a verified brand logo in supporting inboxes. Publishing a BIMI record alone is not enough — you also need a valid BIMI SVG hosted over HTTPS.',
      technicalDetail: missingBimiTechnicalDetail(domain),
      severity: 'warn',
      howToFix:
        'Add a BIMI TXT record at default._bimi with v=BIMI1 and l= pointing to your HTTPS SVG logo.',
      dnsRecords: [
        {
          type: 'TXT',
          host: exampleBimiHost(domain),
          value: exampleBimiRecordValue(domain),
          note: BIMI_PLACEHOLDER_SVG_NOTE,
          exampleOnly: true,
        },
      ],
      callout: PAID_BIMI_HOSTING_CTA,
    });
    recommendations.push('Publish a BIMI DNS record with your logo URL.');
  } else if (!tags.l) {
    bimiRecordStatus = {
      status: 'fail',
      record: bimiRecord,
      tags,
      summary: 'BIMI record exists but is missing your logo link',
    };
    issues.push({
      title: 'BIMI record is incomplete',
      plainEnglishExplanation: 'Your BIMI setup is started, but the logo link is missing.',
      technicalDetail: bimiRecord,
      severity: 'fail',
      howToFix: 'Add l=https://yourdomain.com/logo.svg to your BIMI TXT record.',
    });
  } else if (tags.v?.toUpperCase() !== 'BIMI1') {
    bimiRecordStatus = {
      status: 'warn',
      record: bimiRecord,
      tags,
      summary: 'BIMI record version looks unusual',
    };
    issues.push({
      title: 'BIMI record may be malformed',
      plainEnglishExplanation: 'Your BIMI record uses an unexpected version tag.',
      technicalDetail: bimiRecord,
      severity: 'warn',
      howToFix: 'Ensure the record starts with v=BIMI1;',
    });
  } else {
    bimiRecordStatus = {
      status: 'pass',
      record: bimiRecord,
      tags,
      summary: 'BIMI DNS record is published',
    };
  }

  const svgStatus = tags.l ? await validateBimiSvgUrl(tags.l) : {
    status: 'unknown' as const,
    summary: 'No logo URL to check yet',
    issues: [],
  };

  for (const svgIssue of svgStatus.issues) {
    issues.push({
      title: 'Logo file needs attention',
      plainEnglishExplanation: svgIssue,
      technicalDetail: tags.l,
      severity: svgStatus.status === 'fail' ? 'fail' : 'warn',
      howToFix: 'Use a square, self-contained SVG under 32KB hosted over HTTPS.',
    });
  }

  const certificateStatus = await analyzeBimiCertificate(tags.a);
  if (certificateStatus.classification === 'none') {
    issues.push({
      title: 'Certificate not configured',
      plainEnglishExplanation: certificateStatus.summary,
      technicalDetail: tags.a,
      severity: 'warn',
      howToFix: 'Work with a BIMI certificate provider if Gmail logo display is your goal.',
    });
    recommendations.push('Consider a VMC if Gmail inbox logos are important.');
  }

  const providerReadiness = computeProviderReadiness({
    dmarc: dmarcStatus,
    hasBimiRecord: Boolean(bimiRecord),
    svg: svgStatus,
    cert: certificateStatus,
  });

  const status = overallStatus([
    dmarcStatus.status === 'unknown' ? 'warn' : dmarcStatus.status,
    bimiRecordStatus.status === 'unknown' ? 'warn' : bimiRecordStatus.status,
    svgStatus.status === 'unknown' ? 'warn' : svgStatus.status,
    certificateStatus.status === 'unknown' ? 'warn' : certificateStatus.status,
  ]);

  if (status === 'pass') {
    recommendations.push('Keep your SVG hosted and renew certificates before they expire.');
  }

  return {
    domain,
    status,
    dmarcStatus,
    bimiRecordStatus,
    svgStatus,
    certificateStatus,
    providerReadiness,
    issues,
    recommendations,
    implementationSteps: [...BIMI_IMPLEMENTATION_STEPS],
  };
}

export function mapBimiResultToScanOutput(result: BIMIResult): {
  category: CategoryResult;
  issues: DomainIssue[];
  bimiResult: BIMIResult;
} {
  const domainIssues: DomainIssue[] = result.issues.map((issue) => ({
    category: 'bimi' as const,
    severity: issue.severity,
    title: issue.title,
    explanation: issue.plainEnglishExplanation,
    recommendation: issue.howToFix,
    technicalDetail: issue.technicalDetail,
    dnsRecords: issue.dnsRecords,
    callout: issue.callout,
    stepsToPass:
      issue.severity !== 'info' && !issue.dnsRecords?.length ? [issue.howToFix] : undefined,
  }));

  let summary = 'BIMI not ready';
  if (result.status === 'pass') summary = 'Ready for BIMI in supporting inboxes';
  else if (result.status === 'warn') summary = 'BIMI partially configured';
  else if (result.status === 'fail') summary = 'BIMI not eligible or incomplete';

  const categoryStatus: CheckStatus =
    result.status === 'unknown' ? 'warn' : result.status;

  return {
    category: buildCategoryResult('bimi', categoryStatus, summary),
    issues: domainIssues,
    bimiResult: result,
  };
}
