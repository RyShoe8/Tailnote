import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const OrgBrandTrustScanSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    domain: { type: String, required: true, trim: true, lowercase: true },
    domainSlug: { type: String, required: true, trim: true, lowercase: true },
    lastScannedAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

OrgBrandTrustScanSchema.index({ organizationId: 1, domain: 1 }, { unique: true });

export type OrgBrandTrustScanDoc = InferSchemaType<typeof OrgBrandTrustScanSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const OrgBrandTrustScanModel =
  mongoose.models.OrgBrandTrustScan ??
  mongoose.model('OrgBrandTrustScan', OrgBrandTrustScanSchema);
