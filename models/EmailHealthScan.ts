import mongoose, { Schema } from 'mongoose';

const DnsRecordSchema = new Schema(
  {
    type: { type: String, required: true },
    host: { type: String, required: true },
    value: { type: String, required: true },
    note: { type: String },
    exampleOnly: { type: Boolean },
  },
  { _id: false }
);

const DomainIssueSchema = new Schema(
  {
    category: {
      type: String,
      enum: ['spf', 'dkim', 'dmarc', 'bimi', 'mx', 'tls', 'https'],
      required: true,
    },
    severity: { type: String, enum: ['info', 'warn', 'fail'], required: true },
    title: { type: String, required: true },
    explanation: { type: String, required: true },
    recommendation: { type: String, required: true },
    stepsToPass: { type: [String], default: undefined },
    technicalDetail: { type: String },
    dnsRecords: { type: [DnsRecordSchema], default: [] },
    callout: { type: String },
  },
  { _id: false }
);

const CategoryResultSchema = new Schema(
  {
    category: {
      type: String,
      enum: ['spf', 'dkim', 'dmarc', 'bimi', 'mx', 'tls', 'https'],
      required: true,
    },
    status: { type: String, enum: ['pass', 'warn', 'fail'], required: true },
    points: { type: Number, required: true },
    maxPoints: { type: Number, required: true },
    summary: { type: String, required: true },
  },
  { _id: false }
);

const EmailHealthScanSchema = new Schema(
  {
    domain: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    domainSlug: { type: String, required: true, index: true, trim: true, lowercase: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    statusLabel: {
      type: String,
      enum: ['Excellent', 'Good', 'Needs Attention', 'High Risk'],
      required: true,
    },
    categories: { type: [CategoryResultSchema], default: [] },
    issues: { type: [DomainIssueSchema], default: [] },
    mailProvider: { type: String },
    scannedAt: { type: Date, required: true, index: true },
    bimiDetailJson: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: false }
);

export type EmailHealthScanDoc = mongoose.InferSchemaType<typeof EmailHealthScanSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const EmailHealthScanModel: mongoose.Model<EmailHealthScanDoc> =
  (mongoose.models.EmailHealthScan as mongoose.Model<EmailHealthScanDoc> | undefined) ??
  mongoose.model<EmailHealthScanDoc>('EmailHealthScan', EmailHealthScanSchema);
