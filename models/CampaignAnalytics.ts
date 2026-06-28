import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const CampaignAnalyticsSchema = new Schema(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: 'CampaignSubmission', required: true, index: true },
    
    // Website / Landing Page Metrics
    landingViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    
    // Signature Metrics
    signatureViews: { type: Number, default: 0 },
    signatureClicks: { type: Number, default: 0 },
    websiteClicks: { type: Number, default: 0 },
    
    // Social Metrics
    socialViews: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type CampaignAnalyticsDoc = InferSchemaType<typeof CampaignAnalyticsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CampaignAnalyticsModel =
  mongoose.models.CampaignAnalytics ?? mongoose.model('CampaignAnalytics', CampaignAnalyticsSchema);
