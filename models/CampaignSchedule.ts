import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const CampaignScheduleSchema = new Schema(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: 'CampaignSubmission', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    
    // Array tracking what was posted and when (e.g. Tuesday launch, Friday follow-up)
    publishedEvents: {
      type: [
        {
          eventType: { type: String }, // e.g., 'social_launch', 'social_followup'
          publishedAt: { type: Date },
          platformResponses: { type: Schema.Types.Mixed }, // Details of the API responses from platforms
        },
      ],
      default: [],
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type CampaignScheduleDoc = InferSchemaType<typeof CampaignScheduleSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CampaignScheduleModel =
  mongoose.models.CampaignSchedule ?? mongoose.model('CampaignSchedule', CampaignScheduleSchema);
