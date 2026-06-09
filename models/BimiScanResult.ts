import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const BimiScanResultSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true, default: null },
    domain: { type: String, required: true, trim: true, lowercase: true, index: true },
    readinessStatus: {
      type: String,
      enum: ['pass', 'warn', 'fail', 'unknown'],
      required: true,
    },
    dmarcStatus: { type: String, default: '' },
    bimiRecordStatus: { type: String, default: '' },
    svgStatus: { type: String, default: '' },
    certificateStatus: { type: String, default: '' },
    issuesJson: { type: Schema.Types.Mixed, default: [] },
    recommendationsJson: { type: Schema.Types.Mixed, default: [] },
    implementationStepsJson: { type: Schema.Types.Mixed, default: [] },
    fullResultJson: { type: Schema.Types.Mixed },
    scannedAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

BimiScanResultSchema.index(
  { organizationId: 1, domain: 1 },
  { unique: true, partialFilterExpression: { organizationId: { $type: 'objectId' } } }
);

export type BimiScanResultDoc = InferSchemaType<typeof BimiScanResultSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const BimiScanResultModel =
  mongoose.models.BimiScanResult ??
  mongoose.model('BimiScanResult', BimiScanResultSchema);
