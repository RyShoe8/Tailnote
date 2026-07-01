'use server';

import { getServerSession } from '@/lib/auth/session';
import { isPlatformAdmin } from '@/lib/auth/platformAdmin';
import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { CampaignScheduleModel } from '@/models/CampaignSchedule';
import { sendEmail } from '@/lib/email/mail';
import { buildSpotlightApprovedEmail } from '@/lib/email/templates/spotlight';

function getNextDayOfWeek(date: Date, dayOfWeek: number) {
  const resultDate = new Date(date.getTime());
  resultDate.setDate(date.getDate() + ((7 + dayOfWeek - date.getDay()) % 7 || 7));
  resultDate.setHours(9, 0, 0, 0); // 9 AM
  return resultDate;
}

export async function resolveVoteAction() {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!(await isPlatformAdmin(session.user.id))) throw new Error('Forbidden');

  await connectMongoose();
  
  const votingSubmissions = await CampaignSubmissionModel.find({ status: 'voting' })
    .sort({ votes: -1 })
    .populate('userId');
    
  if (votingSubmissions.length === 0) return { success: false, message: 'No active voting submissions' };

  const winner = votingSubmissions[0];
  const losers = votingSubmissions.slice(1);

  const now = new Date();
  
  // Winner gets next Tuesday
  const tuesday = getNextDayOfWeek(now, 2); // 2 = Tuesday
  // Losers get next Thursday
  const thursday = getNextDayOfWeek(now, 4); // 4 = Thursday

  // Process winner
  winner.status = 'scheduled';
  winner.isVoteWinner = true;
  await winner.save();
  await CampaignScheduleModel.findOneAndUpdate(
    { submissionId: winner._id },
    { startDate: tuesday, endDate: new Date(tuesday.getTime() + 7 * 24 * 60 * 60 * 1000) }, // 1 week duration
    { upsert: true }
  );
  
  // Process losers
  for (const loser of losers) {
    loser.status = 'scheduled';
    loser.isVoteWinner = false;
    await loser.save();
    await CampaignScheduleModel.findOneAndUpdate(
      { submissionId: loser._id },
      { startDate: thursday, endDate: new Date(thursday.getTime() + 7 * 24 * 60 * 60 * 1000) },
      { upsert: true }
    );
  }
  
  // Send emails
  const db = mongoose.connection.db;
  
  const notifyUser = async (submission: any) => {
    const submitter = db ? await db.collection('user').findOne({ id: submission.userId }) : null;
    const submitterEmail = submitter?.email;
    if (submitterEmail) {
      const { subject, html, text } = buildSpotlightApprovedEmail(submission);
      await sendEmail({ to: submitterEmail, subject, html, text });
    }
  };
  
  await notifyUser(winner);
  for (const loser of losers) {
    await notifyUser(loser);
  }

  return { success: true };
}
