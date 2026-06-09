import {
  CATEGORY_WEIGHTS,
  type CategoryResult,
  type CheckStatus,
  type DomainIssue,
  type EmailHealthCategory,
  type StatusLabel,
} from '@/lib/email-health/types';

export function statusToPoints(status: CheckStatus, maxPoints: number): number {
  if (status === 'pass') return maxPoints;
  if (status === 'warn') return Math.round(maxPoints * 0.55);
  return 0;
}

export function scoreFromCategories(categories: CategoryResult[]): number {
  const total = categories.reduce((sum, c) => sum + c.points, 0);
  return Math.min(100, Math.max(0, Math.round(total)));
}

export function statusLabelFromScore(score: number): StatusLabel {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Needs Attention';
  return 'High Risk';
}

export function buildCategoryResult(
  category: EmailHealthCategory,
  status: CheckStatus,
  summary: string
): CategoryResult {
  const maxPoints = CATEGORY_WEIGHTS[category];
  return {
    category,
    status,
    maxPoints,
    points: statusToPoints(status, maxPoints),
    summary,
  };
}

export function aggregateDnsRecords(issues: DomainIssue[]) {
  const seen = new Set<string>();
  const records: NonNullable<DomainIssue['dnsRecords']> = [];
  for (const issue of issues) {
    for (const rec of issue.dnsRecords ?? []) {
      const key = `${rec.type}|${rec.host}|${rec.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      records.push(rec);
    }
  }
  return records;
}

/** DNS records from info-level issues not already shown on problem cards. */
export function aggregateDnsRecordsNotOnProblemCards(issues: DomainIssue[]) {
  const problemCardRecords = aggregateDnsRecords(
    issues.filter((i) => i.severity === 'warn' || i.severity === 'fail'),
  );
  const problemKeys = new Set(
    problemCardRecords.map((rec) => `${rec.type}|${rec.host}|${rec.value}`),
  );

  const seen = new Set<string>();
  const records: NonNullable<DomainIssue['dnsRecords']> = [];
  for (const issue of issues) {
    if (issue.severity !== 'info') continue;
    for (const rec of issue.dnsRecords ?? []) {
      const key = `${rec.type}|${rec.host}|${rec.value}`;
      if (problemKeys.has(key) || seen.has(key)) continue;
      seen.add(key);
      records.push(rec);
    }
  }
  return records;
}
