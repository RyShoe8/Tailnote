import type { EmailHealthReport } from '@/lib/email-health/types';
import { EmailHealthScanModel } from '@/models/EmailHealthScan';

export async function persistEmailHealthScan(
  report: EmailHealthReport,
  meta: { ip?: string; userAgent?: string }
) {
  return EmailHealthScanModel.findOneAndUpdate(
    { domain: report.domain },
    {
      domain: report.domain,
      domainSlug: report.domainSlug,
      score: report.score,
      statusLabel: report.statusLabel,
      categories: report.categories,
      issues: report.issues,
      mailProvider: report.mailProvider,
      scannedAt: report.scannedAt,
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}
