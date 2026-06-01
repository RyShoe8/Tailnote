import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { EmailHealthScanModel } from '@/models/EmailHealthScan';

export type EmailHealthStatusLabel = 'Excellent' | 'Good' | 'Needs Attention' | 'High Risk';

export type AdminEmailHealthScanRow = {
  id: string;
  domain: string;
  domainSlug: string;
  score: number;
  statusLabel: EmailHealthStatusLabel;
  mailProvider: string;
  scannedAt: string;
  ip: string;
};

type ScanLean = {
  _id: mongoose.Types.ObjectId;
  domain: string;
  domainSlug: string;
  score: number;
  statusLabel: EmailHealthStatusLabel;
  mailProvider?: string;
  scannedAt: Date;
  ip?: string;
};

function toRow(doc: ScanLean): AdminEmailHealthScanRow {
  return {
    id: String(doc._id),
    domain: doc.domain,
    domainSlug: doc.domainSlug,
    score: doc.score,
    statusLabel: doc.statusLabel,
    mailProvider: doc.mailProvider ?? '',
    scannedAt: doc.scannedAt.toISOString(),
    ip: doc.ip ?? '',
  };
}

const LIST_LIMIT = 500;

export async function countEmailHealthScans(): Promise<number> {
  await connectMongoose();
  return EmailHealthScanModel.countDocuments();
}

export async function listEmailHealthScans(): Promise<AdminEmailHealthScanRow[]> {
  await connectMongoose();
  const docs = await EmailHealthScanModel.find({})
    .select('domain domainSlug score statusLabel mailProvider scannedAt ip')
    .sort({ scannedAt: -1 })
    .limit(LIST_LIMIT)
    .lean<ScanLean[]>();
  return docs.map(toRow);
}
