import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { FeedbackSubmissionModel } from '@/models/FeedbackSubmission';

export type AdminFeedbackRow = {
  id: string;
  type: 'bug' | 'feature' | 'contact';
  subject: string;
  details: string;
  imageUrl: string;
  userId: string;
  userEmail: string;
  userName: string;
  organizationId: string;
  organizationName: string;
  status: 'new' | 'read' | 'closed';
  createdAt: string;
  updatedAt: string;
};

type FeedbackLean = {
  _id: mongoose.Types.ObjectId;
  type: 'bug' | 'feature' | 'contact';
  subject: string;
  details: string;
  imageUrl?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  organizationId?: string;
  organizationName?: string;
  status: 'new' | 'read' | 'closed';
  createdAt: Date;
  updatedAt: Date;
};

function toRow(doc: FeedbackLean): AdminFeedbackRow {
  return {
    id: String(doc._id),
    type: doc.type,
    subject: doc.subject,
    details: doc.details,
    imageUrl: doc.imageUrl ?? '',
    userId: doc.userId ?? '',
    userEmail: doc.userEmail,
    userName: doc.userName ?? '',
    organizationId: doc.organizationId ?? '',
    organizationName: doc.organizationName ?? '',
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listFeedbackSubmissions(statusFilter?: string): Promise<AdminFeedbackRow[]> {
  await connectMongoose();
  const filter: Record<string, string> = {};
  if (statusFilter === 'new' || statusFilter === 'read' || statusFilter === 'closed') {
    filter.status = statusFilter;
  }
  const docs = await FeedbackSubmissionModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(500)
    .lean<FeedbackLean[]>();
  return docs.map(toRow);
}

export async function getFeedbackSubmission(id: string): Promise<AdminFeedbackRow | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectMongoose();
  const doc = await FeedbackSubmissionModel.findById(id).lean<FeedbackLean | null>();
  if (!doc) return null;
  return toRow(doc);
}

export async function updateFeedbackStatus(
  id: string,
  status: 'new' | 'read' | 'closed'
): Promise<AdminFeedbackRow | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectMongoose();
  const doc = await FeedbackSubmissionModel.findByIdAndUpdate(id, { status }, { new: true }).lean<
    FeedbackLean | null
  >();
  if (!doc) return null;
  return toRow(doc);
}
