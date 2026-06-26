import { serializeEmailHealthScan } from '@/lib/email-health/serialize';
import type { EmailHealthScanDoc } from '@/models/EmailHealthScan';

export function emailHealthScanJsonResponse(doc: EmailHealthScanDoc, cached: boolean) {
  return {
    cached,
    slug: doc.domainSlug,
    domain: doc.domain,
    score: doc.score,
    statusLabel: doc.statusLabel,
    scannedAt: doc.scannedAt,
    scan: serializeEmailHealthScan(doc),
  };
}
