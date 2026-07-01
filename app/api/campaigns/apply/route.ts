import { NextResponse } from 'next/server';
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
import { SpotlightApplySchema } from '@/lib/campaigns/spotlightApplySchema';
import { persistSpotlightAsBaseSignature } from '@/lib/campaigns/persistSpotlightAsBaseSignature';
import { sanitizeContentBlocksForSave } from '@/lib/quotes/contentBlockSchema';
import type { ContentBlockData } from 'emailsignature-engine';

async function maybeAddQuoteToLibrary(
  data: {
    allowQuoteDatabase?: boolean;
    content: { quote: string };
    founder: string;
    companyName: string;
    website: string;
  },
) {
  if (!data.allowQuoteDatabase || !data.content.quote) return;

  const normalizedNewQuote = normalizeQuoteText(data.content.quote);
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
      quoteText: data.content.quote,
      attribution: data.founder,
      source: data.companyName,
      sourceUrl: data.website,
      categoryId: category._id,
      categoryName: category.name,
      isActive: false,
      isFeatured: false,
    });
  }
}

async function persistFromApply(
  userId: string,
  data: ReturnType<typeof SpotlightApplySchema.parse>,
) {
  await persistSpotlightAsBaseSignature({
    userId,
    companyName: data.companyName,
    website: data.website,
    logoUrl: data.logoUrl,
    logoHeightPx: data.logoHeightPx,
    logoShape: data.logoShape,
    logoLink: data.logoLink,
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
    fontFamily: data.fontFamily,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
    animation: data.animation,
    socialProfiles: data.socialProfiles,
    brandOrder: data.brandOrder,
    hiddenFields: data.hiddenFields,
    firstName: data.firstName,
    lastName: data.lastName,
    title: data.title,
    email: data.email,
    officePhone: data.officePhone,
    mobilePhone: data.mobilePhone,
    avatarUrl: data.avatarUrl,
    detailOrder: data.detailOrder,
    contactDisplayOrder: data.contactDisplayOrder,
    profileHiddenFields: data.hiddenFields,
    templateId: data.templateId,
    contentBlocks: data.contentBlocks
      ? sanitizeContentBlocksForSave(data.contentBlocks as ContentBlockData[])
      : undefined,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'You must be logged in to apply.' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = SpotlightApplySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.issues },
      { status: 400 },
    );
  }

  await connectMongoose();
  const campaign = await CampaignModel.findOne({ _id: parsed.data.campaignId, status: 'active' });
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found or is no longer active.' }, { status: 404 });
  }

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
  await persistFromApply(session.user.id, parsed.data);
  await maybeAddQuoteToLibrary(parsed.data);

  return NextResponse.json({ success: true, submissionId: submission._id });
}

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'You must be logged in to apply.' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = SpotlightApplySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.issues },
      { status: 400 },
    );
  }

  await connectMongoose();
  const campaign = await CampaignModel.findOne({ _id: parsed.data.campaignId, status: 'active' });
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found or is no longer active.' }, { status: 404 });
  }

  const existing = await CampaignSubmissionModel.findOne({
    campaignId: campaign._id,
    userId: session.user.id,
  });

  if (!existing) {
    return NextResponse.json({ error: 'No submission found to update.' }, { status: 404 });
  }

  if (existing.status !== 'needs_changes') {
    return NextResponse.json(
      { error: 'Only submissions that need changes can be resubmitted.' },
      { status: 400 },
    );
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

  existing.set({
    ...snapshot,
    status: 'pending',
    resubmittedAt: new Date(),
  });
  await existing.save();

  await persistFromApply(session.user.id, parsed.data);
  await maybeAddQuoteToLibrary(parsed.data);

  return NextResponse.json({ success: true, submissionId: existing._id });
}
