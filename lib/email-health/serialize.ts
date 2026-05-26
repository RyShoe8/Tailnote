import type { EmailHealthScanDoc } from '@/models/EmailHealthScan';
import type { CategoryResult, DomainIssue, StatusLabel } from '@/lib/email-health/types';

export type SerializedEmailHealthScan = {
  domain: string;
  domainSlug: string;
  score: number;
  statusLabel: StatusLabel;
  categories: CategoryResult[];
  issues: DomainIssue[];
  mailProvider?: string;
  scannedAt: Date;
};

export function serializeEmailHealthScan(doc: EmailHealthScanDoc): SerializedEmailHealthScan {
  return {
    domain: doc.domain,
    domainSlug: doc.domainSlug,
    score: doc.score,
    statusLabel: doc.statusLabel as StatusLabel,
    categories: JSON.parse(JSON.stringify(doc.categories)) as CategoryResult[],
    issues: JSON.parse(JSON.stringify(doc.issues)) as DomainIssue[],
    mailProvider: doc.mailProvider ?? undefined,
    scannedAt: new Date(doc.scannedAt),
  };
}
