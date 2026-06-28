import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const CampaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true, index: true }, // e.g., "spotlight"
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'active',
    },
    defaultScheduleDays: { type: Number, default: 14 },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type CampaignDoc = InferSchemaType<typeof CampaignSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CampaignModel =
  mongoose.models.Campaign ?? mongoose.model('Campaign', CampaignSchema);
