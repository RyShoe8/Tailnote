import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const CampaignSubmissionSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    userId: { type: String, required: true, index: true },
    slug: { type: String, unique: true, sparse: true, index: true }, // SEO URL slug e.g. "acme-corp"
    
    // Company Information
    companyName: { type: String, required: true, trim: true },
    website: { type: String, required: true, trim: true },
    logoUrl: { type: String, required: true },
    founder: { type: String, required: true, trim: true },
    industry: { type: String, required: true, trim: true },
    companySize: { type: String, required: true, trim: true },
    
    // Flexible content payload (for Spotlight: quote, quoteAuthor, description)
    content: { type: Schema.Types.Mixed, required: true },
    
    // Socials
    socialPlatforms: { type: [String], default: [] }, // e.g. ["linkedin", "bluesky", "reddit", "x"]
    socialProfiles: { type: Schema.Types.Mixed, default: {} },
    
    agreedToTerms: { type: Boolean, required: true },
    
    status: {
      type: String,
      enum: ['pending', 'approved', 'needs_changes', 'rejected', 'scheduled', 'published', 'archived'],
      default: 'pending',
      index: true,
    },
    
    gamificationBadge: {
      type: String,
      enum: ['none', 'spotlight', 'gold'],
      default: 'none',
    },
    
    reviewerNotes: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type CampaignSubmissionDoc = InferSchemaType<typeof CampaignSubmissionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CampaignSubmissionModel =
  mongoose.models.CampaignSubmission ?? mongoose.model('CampaignSubmission', CampaignSubmissionSchema);
