import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const KINDS = [
  'logo',
  'website',
  'email',
  'office_phone',
  'mobile_phone',
  'social_linkedin',
  'social_facebook',
  'social_instagram',
  'social_reddit',
  'social_discord',
  'social_bluesky',
  'social_youtube',
  'content_block_1',
  'content_block_2',
  'save_contact',
] as const;

export type SignatureClickKind = (typeof KINDS)[number];

const SignatureClickEventSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
    kind: { type: String, required: true, enum: KINDS },
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote', index: true },
    userAgent: { type: String, default: '' },
    referer: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

SignatureClickEventSchema.index({ organizationId: 1, createdAt: -1 });
SignatureClickEventSchema.index({ organizationId: 1, kind: 1, createdAt: -1 });

export type SignatureClickEventDoc = InferSchemaType<typeof SignatureClickEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SignatureClickEventModel =
  mongoose.models.SignatureClickEvent ?? mongoose.model('SignatureClickEvent', SignatureClickEventSchema);
