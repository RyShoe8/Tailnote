export type EmailHealthCategory =
  | 'spf'
  | 'dkim'
  | 'dmarc'
  | 'bimi'
  | 'mx'
  | 'tls'
  | 'https';

export type CheckStatus = 'pass' | 'warn' | 'fail';

export type IssueSeverity = 'info' | 'warn' | 'fail';

export type StatusLabel = 'Excellent' | 'Good' | 'Needs Attention' | 'High Risk';

export type DnsRecordSuggestion = {
  type: string;
  host: string;
  value: string;
  note?: string;
  exampleOnly?: boolean;
};

export type DomainIssue = {
  category: EmailHealthCategory;
  severity: IssueSeverity;
  title: string;
  explanation: string;
  recommendation: string;
  stepsToPass?: string[];
  technicalDetail?: string;
  dnsRecords?: DnsRecordSuggestion[];
  callout?: string;
};

export type CategoryResult = {
  category: EmailHealthCategory;
  status: CheckStatus;
  points: number;
  maxPoints: number;
  summary: string;
};

export type EmailHealthReport = {
  domain: string;
  domainSlug: string;
  score: number;
  statusLabel: StatusLabel;
  categories: CategoryResult[];
  issues: DomainIssue[];
  mailProvider?: string;
  scannedAt: Date;
  bimiDetail?: import('@/lib/email-health/bimiTypes').BIMIResult;
};

export const CATEGORY_WEIGHTS: Record<EmailHealthCategory, number> = {
  spf: 20,
  dkim: 20,
  dmarc: 25,
  bimi: 10,
  tls: 10,
  mx: 10,
  https: 5,
};
