import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const EmployeeSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: '', trim: true },
    title: { type: String, default: '', trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    /** References SignatureTemplate doc _id */
    templateId: { type: Schema.Types.ObjectId, ref: 'SignatureTemplate', required: true },
    previewToken: { type: String, required: true, unique: true, index: true },
    inviteToken: { type: String, unique: true, sparse: true, index: true },
    inviteSentAt: { type: Date },
    inviteAcceptedAt: { type: Date },
    inviteExpiresAt: { type: Date },
    /** Better Auth user id after invite acceptance */
    userId: { type: String, default: '', index: true },
    /** When true, this employee has saved their own promo blocks (editable mode only). */
    promoBlocksCustomized: { type: Boolean, default: false },
    /** Up to 2 promotional content blocks displayed in the corporate template. */
    contentBlocks: [
      {
        type: {
          type: String,
          enum: [
            'book_a_call',
            'latest_blogs',
            'dynamic_content',
            'custom',
            'list',
            'image',
            'quote',
          ],
        },
        enabled: { type: Boolean, default: true },
        // Book a Call
        callTitle: { type: String },
        callUrl: { type: String },
        callButtonText: { type: String },
        // Latest Blogs / Dynamic Content
        rssUrl: { type: String },
        rssItems: [
          {
            title: { type: String },
            url: { type: String },
            imageUrl: { type: String },
            pubDate: { type: String },
          },
        ],
        rssLastFetched: { type: Date },
        /** Optional auto-refresh cadence: 'none' (manual only), 'daily', 'weekly' */
        rssRefreshInterval: { type: String, enum: ['none', 'daily', 'weekly'], default: 'none' },
        contentSourceId: { type: String },
        websiteUrl: { type: String },
        feedUrl: { type: String },
        detectionMode: { type: String, enum: ['auto', 'rss'] },
        postsToDisplay: { type: Number, enum: [1, 2, 3] },
        contentImageUrl: { type: String },
        // List (and legacy custom)
        listTitle: { type: String },
        listItems: [
          {
            title: { type: String },
            description: { type: String },
            url: { type: String },
            urlPrefix: { type: String, enum: ['https', 'www'] },
          },
        ],
        imageUrl: { type: String },
        imageLinkUrl: { type: String },
        quoteSource: { type: String, enum: ['library', 'custom'] },
        quoteId: { type: String },
        quoteText: { type: String },
        quoteAttribution: { type: String },
        quoteShowAttribution: { type: Boolean },
        quoteAlignment: { type: String, enum: ['left', 'center'] },
        quoteFontSize: { type: String, enum: ['small', 'medium', 'large'] },
        quoteStyle: { type: String, enum: ['standard', 'minimal', 'highlighted'] },
        // Custom (legacy)
        customTitle: { type: String },
        customText: { type: String },
        customUrl: { type: String },
        customImageUrl: { type: String },
      },
    ],
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

EmployeeSchema.index({ organizationId: 1, email: 1 }, { unique: true });

export type EmployeeDoc = InferSchemaType<typeof EmployeeSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const EmployeeModel =
  mongoose.models.Employee ?? mongoose.model('Employee', EmployeeSchema);
