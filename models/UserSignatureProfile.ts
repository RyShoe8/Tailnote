import mongoose, { Schema } from 'mongoose';

/** Saved signature preview / sample person fields for dashboard (per Tailnote user). */
const UserSignatureProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true, trim: true, default: '' },
    lastName: { type: String, required: true, trim: true, default: '' },
    title: { type: String, required: true, trim: true, default: '' },
    email: { type: String, required: true, trim: true, default: '' },
    officePhone: { type: String, default: '' },
    mobilePhone: { type: String, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    hiddenFields: { type: [String], default: [] },
    detailOrder: { type: [String], default: [] },
    contentBlocks: { type: Schema.Types.Mixed, default: [] },
    templateId: { type: Schema.Types.ObjectId, ref: 'SignatureTemplate', default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type UserSignatureProfileDoc = mongoose.InferSchemaType<typeof UserSignatureProfileSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserSignatureProfileModel: mongoose.Model<UserSignatureProfileDoc> =
  (mongoose.models.UserSignatureProfile as mongoose.Model<UserSignatureProfileDoc> | undefined) ??
  mongoose.model<UserSignatureProfileDoc>('UserSignatureProfile', UserSignatureProfileSchema);
