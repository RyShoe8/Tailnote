import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const OrganizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    logoUrl: { type: String, default: '' },
    /** Rendered logo height in px at template width (Outlook needs explicit dimensions). */
    logoHeightPx: { type: Number, min: 1, max: 400 },
    logoShape: {
      type: String,
      enum: ['rectangle', 'circle'],
      default: 'rectangle',
    },
    primaryColor: { type: String, default: '#0a0a0a' },
    secondaryColor: { type: String, default: '' },
    website: { type: String, default: '' },
    /** Legacy slug mirror of pinned SubscriptionPlan; defaults to FREE tier. */
    plan: { type: String, default: 'free', trim: true, lowercase: true },
    stripeCustomerId: { type: String, default: '' },
    stripeSubscriptionId: { type: String, default: '' },
    subscriptionStatus: {
      type: String,
      enum: ['none', 'active', 'trialing', 'past_due', 'canceled', 'incomplete'],
      default: 'none',
    },
    /** Org-wide brand fields for signature engine */
    companyName: { type: String, default: '' },
    fontFamily: { type: String, default: 'Arial' },
    logoLink: { type: String, default: '' },
    socialLinks: {
      linkedin: { type: String },
      facebook: { type: String },
      instagram: { type: String },
      reddit: { type: String },
      discord: { type: String },
      bluesky: { type: String },
      youtube: { type: String },
    },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    animation: {
      enabled: { type: Boolean, default: false },
      gifUrl: { type: String },
    },
    hiddenFields: { type: [String], default: [] },
    brandOrder: { type: [String], default: [] },
    /** When true, signature links are rewritten through /api/track/signature for click analytics. */
    signatureClickTrackingEnabled: { type: Boolean, default: true },
    /** When true, a 1×1 tracking pixel is appended to rendered signatures for open analytics. */
    signatureOpenTrackingEnabled: { type: Boolean, default: false },
    /** UTM tracking appended to http/https links in rendered signatures (default on). */
    utmEnabled: { type: Boolean, default: true },
    /** When true, invited employees may edit organization brand fields in the dashboard. */
    employeesCanEditBrand: { type: Boolean, default: false },
    /** When true, invited employees may edit their promotional blocks; when false, owner blocks apply org-wide. */
    employeesCanEditPromoBlocks: { type: Boolean, default: false },
    /** Hosted BIMI SVG logo URL (paid feature). */
    bimiLogoUrl: { type: String, default: '' },
    bimiLogoUploadedAt: { type: Date },
    /** Suggested v=BIMI1; l=... TXT value for copy-paste. */
    bimiSuggestedRecord: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type OrganizationDoc = InferSchemaType<typeof OrganizationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const OrganizationModel =
  mongoose.models.Organization ?? mongoose.model('Organization', OrganizationSchema);
