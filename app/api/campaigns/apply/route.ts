import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignModel } from '@/models/Campaign';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { QuoteModel } from '@/models/Quote';
import { QuoteCategoryModel } from '@/models/QuoteCategory';
import { getServerSession } from '@/lib/auth/session';
import {
  buildSubmissionCreatePayload,
  resolveSubmissionSnapshot,
} from '@/lib/campaigns/resolveSubmissionSnapshot';
import { loadSubmitterSnapshotSources } from '@/lib/campaigns/loadSubmitterSnapshotSources';
import { isQuoteAlreadyUsed } from '@/lib/quotes/isQuoteAlreadyUsed';
import { normalizeQuoteText } from '@/lib/quotes/normalizeQuoteText';

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

const ApplySchema = z.object({
  campaignId: z.string().min(1),
  companyName: z.string().trim().min(1).max(200),
  website: z.preprocess(urlPreprocess, z.string().url().max(2000)),
  logoUrl: z.preprocess(urlPreprocess, z.string().url().max(2000)),
  founder: z.string().trim().min(1).max(200),
  industry: z.string().trim().min(1).max(100),
  companySize: z.string().trim().min(1).max(100),
  // User Signature Profile Data
  firstName: z.string().trim().default(''),
  lastName: z.string().trim().default(''),
  title: z.string().trim().default(''),
  email: z.string().trim().default(''),
  officePhone: z.string().default(''),
  mobilePhone: z.string().default(''),
  avatarUrl: z.string().trim().default(''),
  // Organization Brand Data
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
  animation: z.object({
    enabled: z.boolean().default(false),
    gifUrl: z.string().trim().default(''),
  }).optional(),
  content: z.object({
    quote: z.string().trim().min(1).max(500),
    description: z.string().trim().min(1).max(1000),
    whyShouldWeFeatureYou: z.string().trim().min(1).max(2000),
  }),
  socialPlatforms: z.array(z.string()).min(1),
  socialProfiles: z.record(z.string()).optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms.",
  }),
  allowQuoteDatabase: z.boolean().optional(),
});

export async function POST(request: Request) {
  let session;
  try {
    session = await getServerSession();
  } catch {
    // Optional: Only allow logged-in users? The PRD says "Every Tailnote user should eventually think...". 
    // Wait, the plan says "Increase free user acquisition", which means they might apply BEFORE signing up? 
    // Actually, let's enforce user login for submissions, as it requires userId.
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'You must be logged in to apply.' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ApplySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectMongoose();
  const campaign = await CampaignModel.findOne({ _id: parsed.data.campaignId, status: 'active' });
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found or is no longer active.' }, { status: 404 });
  }

  // Check if user already applied
  const existing = await CampaignSubmissionModel.findOne({
    campaignId: campaign._id,
    userId: session.user.id,
  });

  if (existing) {
    return NextResponse.json({ error: 'You have already applied for this campaign.' }, { status: 400 });
  }

  const quoteCheck = await isQuoteAlreadyUsed(parsed.data.content.quote, {
    excludeUserId: session.user.id,
  });
  if (quoteCheck.used) {
    return NextResponse.json(
      { error: 'This quote has already been used. Please write an original quote.' },
      { status: 400 },
    );
  }

  const sources = await loadSubmitterSnapshotSources(session.user.id);
  const resolved = resolveSubmissionSnapshot({
    submission: parsed.data,
    org: sources.org,
    profile: sources.profile,
    employee: sources.employee,
    authUser: sources.authUser,
  });
  const snapshot = buildSubmissionCreatePayload(parsed.data, resolved);

  const submission = new CampaignSubmissionModel({
    campaignId: campaign._id,
    userId: session.user.id,
    ...snapshot,
    status: 'pending',
  });

  await submission.save();

  if (parsed.data.allowQuoteDatabase && parsed.data.content.quote) {
    const normalizedNewQuote = normalizeQuoteText(parsed.data.content.quote);
    const existingLibraryQuote = await QuoteModel.find({}).select('quoteText').lean();
    const alreadyInLibrary = existingLibraryQuote.some(
      (row) => normalizeQuoteText(row.quoteText) === normalizedNewQuote,
    );

    if (!alreadyInLibrary) {
      let category = await QuoteCategoryModel.findOne({ slug: 'community-submissions' });
      if (!category) {
        category = await QuoteCategoryModel.create({
          name: 'Community Submissions',
          slug: 'community-submissions',
          description: 'Quotes submitted by users via Spotlight applications.',
        });
      }

      await QuoteModel.create({
        quoteText: parsed.data.content.quote,
        attribution: parsed.data.founder,
        source: parsed.data.companyName,
        sourceUrl: parsed.data.website,
        categoryId: category._id,
        categoryName: category.name,
        isActive: false,
        isFeatured: false,
      });
    }
  }

  return NextResponse.json({ success: true, submissionId: submission._id });
}
