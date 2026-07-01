import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const SPOTLIGHT_VOTING_WEEK_STATUSES = ['scheduled', 'open', 'paused', 'ended'] as const;
export type SpotlightVotingWeekStatus = (typeof SPOTLIGHT_VOTING_WEEK_STATUSES)[number];

const SpotlightVotingWeekSchema = new Schema(
  {
    weekStart: { type: Date, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: SPOTLIGHT_VOTING_WEEK_STATUSES,
      default: 'scheduled',
      index: true,
    },
    openedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

export type SpotlightVotingWeekDoc = InferSchemaType<typeof SpotlightVotingWeekSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SpotlightVotingWeekModel =
  mongoose.models.SpotlightVotingWeek ??
  mongoose.model('SpotlightVotingWeek', SpotlightVotingWeekSchema);
