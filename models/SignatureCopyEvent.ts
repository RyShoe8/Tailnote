import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const COPY_METHODS = ['html', 'text'] as const;

export type SignatureCopyMethod = (typeof COPY_METHODS)[number];

const SignatureCopyEventSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
    method: { type: String, required: true, enum: COPY_METHODS },
    userAgent: { type: String, default: '' },
    referer: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

SignatureCopyEventSchema.index({ organizationId: 1, createdAt: -1 });
SignatureCopyEventSchema.index({ organizationId: 1, employeeId: 1, createdAt: -1 });

export type SignatureCopyEventDoc = InferSchemaType<typeof SignatureCopyEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SignatureCopyEventModel =
  mongoose.models.SignatureCopyEvent ??
  mongoose.model('SignatureCopyEvent', SignatureCopyEventSchema);
