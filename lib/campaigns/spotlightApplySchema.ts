import { z } from 'zod';
import { ContentBlocksArraySchema } from '@/lib/quotes/contentBlockSchema';

const urlPreprocess = (val: unknown) => {
  if (typeof val === 'string' && val.trim() !== '') {
    const trimmed = val.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }
  return val;
};

export const SpotlightApplySchema = z.object({
  campaignId: z.string().min(1),
  companyName: z.string().trim().min(1).max(200),
  website: z.preprocess(urlPreprocess, z.string().url().max(2000)),
  logoUrl: z.preprocess(urlPreprocess, z.string().url().max(2000)),
  founder: z.string().trim().min(1).max(200),
  industry: z.string().trim().min(1).max(100),
  companySize: z.string().trim().min(1).max(100),
  firstName: z.string().trim().default(''),
  lastName: z.string().trim().default(''),
  title: z.string().trim().default(''),
  email: z.string().trim().default(''),
  officePhone: z.string().default(''),
  mobilePhone: z.string().default(''),
  avatarUrl: z.string().trim().default(''),
  detailOrder: z.array(z.string()).optional(),
  contactDisplayOrder: z.array(z.string()).optional(),
  hiddenFields: z.array(z.string()).optional(),
  brandOrder: z.array(z.string()).optional(),
  templateId: z.string().trim().optional(),
  contentBlocks: ContentBlocksArraySchema.optional(),
  logoHeightPx: z.number().min(1).max(400).optional(),
  logoShape: z.enum(['rectangle', 'circle']).optional(),
  logoLink: z.string().trim().default(''),
  primaryColor: z.string().trim().default(''),
  secondaryColor: z.string().trim().default(''),
  fontFamily: z.string().trim().default(''),
  address: z.string().trim().default(''),
  city: z.string().trim().default(''),
  state: z.string().trim().default(''),
  zip: z.string().trim().default(''),
  animation: z
    .object({
      enabled: z.boolean().default(false),
      gifUrl: z.string().trim().default(''),
    })
    .optional(),
  content: z.object({
    quote: z.string().trim().min(1).max(500),
    description: z.string().trim().min(1).max(1000),
    whyShouldWeFeatureYou: z.string().trim().min(1).max(2000),
  }),
  socialPlatforms: z.array(z.string()).min(1),
  socialProfiles: z.record(z.string()).optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms.',
  }),
  allowQuoteDatabase: z.boolean().optional(),
});

export type SpotlightApplyInput = z.infer<typeof SpotlightApplySchema>;
