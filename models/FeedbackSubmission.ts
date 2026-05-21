import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const FeedbackSubmissionSchema = new Schema(
  {
    type: { type: String, enum: ['bug', 'feature', 'contact'], required: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    details: { type: String, required: true, trim: true, maxlength: 5000 },
    imageUrl: { type: String, default: '' },
    userId: { type: String, default: '', index: true },
    userEmail: { type: String, required: true, trim: true },
    userName: { type: String, default: '', trim: true },
    organizationId: { type: String, default: '', index: true },
    organizationName: { type: String, default: '', trim: true },
    status: { type: String, enum: ['new', 'read', 'closed'], default: 'new', index: true },
  },
  { timestamps: true }
);

FeedbackSubmissionSchema.index({ createdAt: -1 });

export type FeedbackSubmissionDoc = InferSchemaType<typeof FeedbackSubmissionSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const FeedbackSubmissionModel =
  mongoose.models.FeedbackSubmission ??
  mongoose.model('FeedbackSubmission', FeedbackSubmissionSchema);
