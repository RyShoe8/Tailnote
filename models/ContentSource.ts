import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const CONTENT_DETECTION_METHODS = [
  'auto_path',
  'auto_link',
  'beehiiv',
  'substack',
  'rss_manual',
  'html_scan',
  'migrated_rss',
] as const;

export type ContentDetectionMethod = (typeof CONTENT_DETECTION_METHODS)[number];

export const CONTENT_SOURCE_STATUSES = ['ok', 'error', 'pending'] as const;
export type ContentSourceStatus = (typeof CONTENT_SOURCE_STATUSES)[number];

const ContentSourceSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    ownerUserId: { type: String, default: '', index: true },
    websiteUrl: { type: String, default: '', trim: true },
    feedUrl: { type: String, default: '', trim: true },
    detectionMethod: {
      type: String,
      enum: CONTENT_DETECTION_METHODS,
      default: 'rss_manual',
    },
    etag: { type: String, default: '' },
    lastModified: { type: String, default: '' },
    lastFetchedAt: { type: Date },
    status: { type: String, enum: CONTENT_SOURCE_STATUSES, default: 'pending' },
    consecutiveFailures: { type: Number, default: 0 },
    postsToDisplay: { type: Number, enum: [1, 2, 3], default: 1 },
    imageBlobUrl: { type: String, default: '' },
    imageGeneratedAt: { type: Date },
    imageContentHash: { type: String, default: '' },
  },
  { timestamps: true }
);

ContentSourceSchema.index({ lastFetchedAt: 1 });
ContentSourceSchema.index({ organizationId: 1, websiteUrl: 1 });

export type ContentSourceDoc = InferSchemaType<typeof ContentSourceSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ContentSourceModel =
  mongoose.models.ContentSource ?? mongoose.model('ContentSource', ContentSourceSchema);
