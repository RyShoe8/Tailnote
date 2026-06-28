import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const CampaignAssetSchema = new Schema(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: 'CampaignSubmission', required: true, index: true },
    assetType: {
      type: String,
      enum: ['signature_image', 'social_post_1', 'social_post_2', 'landing_page_hero'],
      required: true,
    },
    url: { type: String, default: '' },
    content: { type: String, default: '' }, // Text copy for social posts
    status: {
      type: String,
      enum: ['pending_generation', 'ready', 'approved'],
      default: 'pending_generation',
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type CampaignAssetDoc = InferSchemaType<typeof CampaignAssetSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CampaignAssetModel =
  mongoose.models.CampaignAsset ?? mongoose.model('CampaignAsset', CampaignAssetSchema);
