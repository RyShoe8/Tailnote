import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const SignatureOpenEventSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
    userAgent: { type: String, default: '' },
    referer: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

SignatureOpenEventSchema.index({ organizationId: 1, createdAt: -1 });
SignatureOpenEventSchema.index({ organizationId: 1, employeeId: 1, createdAt: -1 });

export type SignatureOpenEventDoc = InferSchemaType<typeof SignatureOpenEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SignatureOpenEventModel =
  mongoose.models.SignatureOpenEvent ??
  mongoose.model('SignatureOpenEvent', SignatureOpenEventSchema);
