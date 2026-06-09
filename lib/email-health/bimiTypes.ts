import type { CheckStatus, IssueSeverity } from '@/lib/email-health/types';

export type BimiIssue = {
  title: string;
  plainEnglishExplanation: string;
  technicalDetail?: string;
  severity: IssueSeverity;
  howToFix: string;
};

export type ProviderReadinessStatus = CheckStatus | 'unknown';

export type DmarcBimiEligibilityView = {
  status: CheckStatus | 'unknown';
  policy?: string;
  pct?: string;
  eligibleForBimi: boolean;
  summary: string;
  record?: string;
};

export type SvgValidationView = {
  status: CheckStatus | 'unknown';
  url?: string;
  width?: number;
  height?: number;
  byteSize?: number;
  summary: string;
  issues: string[];
};

export type CertificateAnalysisView = {
  status: CheckStatus | 'unknown';
  classification: 'none' | 'self_asserted' | 'cmc_likely' | 'vmc_likely' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  url?: string;
  summary: string;
  issuerHint?: string;
};

export type BIMIResult = {
  domain: string;
  status: CheckStatus | 'unknown';
  dmarcStatus: DmarcBimiEligibilityView;
  bimiRecordStatus: {
    status: CheckStatus | 'unknown';
    record?: string;
    tags: { v?: string; l?: string; a?: string };
    summary: string;
  };
  svgStatus: SvgValidationView;
  certificateStatus: CertificateAnalysisView;
  providerReadiness: {
    gmail: ProviderReadinessStatus;
    yahoo: ProviderReadinessStatus;
    fastmail: ProviderReadinessStatus;
  };
  issues: BimiIssue[];
  recommendations: string[];
  implementationSteps: string[];
};

export function vmcStatusFromResult(result: BIMIResult): CheckStatus | 'unknown' {
  const c = result.certificateStatus;
  if (c.classification === 'vmc_likely') return c.confidence === 'high' ? 'pass' : 'warn';
  if (c.classification === 'cmc_likely') return 'warn';
  if (c.classification === 'none') return 'fail';
  if (c.classification === 'self_asserted') return 'warn';
  return 'unknown';
}
