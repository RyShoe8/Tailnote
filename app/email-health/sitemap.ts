import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/site';
import { connectMongoose } from '@/lib/mongoose';
import { EmailHealthScanModel } from '@/models/EmailHealthScan';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectMongoose();
    const scans = await EmailHealthScanModel.find({})
      .sort({ scannedAt: -1 })
      .limit(500)
      .select('domainSlug scannedAt')
      .lean<{ domainSlug: string; scannedAt: Date }[]>();

    return scans.map((scan) => ({
      url: absoluteUrl(`/email-health/${scan.domainSlug}`),
      lastModified: scan.scannedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}
