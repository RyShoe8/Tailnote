import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import {
  assertSubmissionWeekIsOpen,
  voteCookieNameForWeek,
} from '@/lib/campaigns/spotlightVotingWeeks';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json();
    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 });
    }

    await connectMongoose();

    const weekCheck = await assertSubmissionWeekIsOpen(submissionId);
    if (!weekCheck.ok) {
      return NextResponse.json({ error: weekCheck.error }, { status: 403 });
    }

    const cookieName = voteCookieNameForWeek(weekCheck.weekStart);
    const cookieStore = await cookies();
    if (cookieStore.get(cookieName)) {
      return NextResponse.json({ error: 'You have already voted this week' }, { status: 403 });
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    const existingSubmission = await CampaignSubmissionModel.findById(submissionId).select('voterIps');
    if (!existingSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (existingSubmission.voterIps?.includes(ip)) {
      return NextResponse.json({ error: 'You have already voted this week' }, { status: 403 });
    }

    const submission = await CampaignSubmissionModel.findByIdAndUpdate(
      submissionId,
      {
        $inc: { votes: 1 },
        $push: { voterIps: ip },
      },
      { new: true },
    );

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    cookieStore.set(cookieName, 'true', {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true, votes: submission.votes });
  } catch (error: unknown) {
    console.error('Failed to vote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
