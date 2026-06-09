import { slugToDomain } from '@/lib/email-health/domain';
import { persistEmailHealthScan } from '@/lib/email-health/persist';
import { runEmailHealthScan } from '@/lib/email-health/runScan';
import { serializeEmailHealthScan, type SerializedEmailHealthScan } from '@/lib/email-health/serialize';
import { connectMongoose } from '@/lib/mongoose';
import { EmailHealthScanModel, type EmailHealthScanDoc } from '@/models/EmailHealthScan';

export async function loadScanBySlug(slug: string): Promise<SerializedEmailHealthScan | null> {
  await connectMongoose();
  const doc = await EmailHealthScanModel.findOne({ domainSlug: slug.toLowerCase() }).lean<EmailHealthScanDoc>();
  return doc ? serializeEmailHealthScan(doc) : null;
}

/** If no cached scan exists for a direct URL visit, run once server-side. */
export async function loadOrCreateScanBySlug(slug: string): Promise<SerializedEmailHealthScan | null> {
  const existing = await loadScanBySlug(slug);
  if (existing) return existing;

  try {
    const domain = slugToDomain(slug);
    const report = await runEmailHealthScan(domain);
    await connectMongoose();
    const saved = await persistEmailHealthScan(report, {});
    if (!saved) return null;
    return serializeEmailHealthScan(saved as EmailHealthScanDoc);
  } catch {
    return null;
  }
}
