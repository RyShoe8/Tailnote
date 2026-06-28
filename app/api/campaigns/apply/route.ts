import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignModel } from '@/models/Campaign';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { getServerSession } from '@/lib/auth/session';

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
  const campaign = await CampaignModel.findOne({ _id: parsed.data.campaignId, isActive: true });
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

  // Create submission
  const submission = new CampaignSubmissionModel({
    campaignId: campaign._id,
    userId: session.user.id,
    companyName: parsed.data.companyName,
    website: parsed.data.website,
    logoUrl: parsed.data.logoUrl,
    founder: parsed.data.founder,
    industry: parsed.data.industry,
    companySize: parsed.data.companySize,
    content: parsed.data.content,
    socialPlatforms: parsed.data.socialPlatforms,
    socialProfiles: parsed.data.socialProfiles || {},
    agreedToTerms: parsed.data.agreedToTerms,
    status: 'pending',
  });

  await submission.save();

  return NextResponse.json({ success: true, submissionId: submission._id });
}
