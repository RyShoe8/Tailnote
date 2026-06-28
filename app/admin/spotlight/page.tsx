import Link from 'next/link';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { CampaignScheduleModel } from '@/models/CampaignSchedule';

export default async function SpotlightAdminPage() {
  await connectMongoose();
  
  // Real numbers
  const pendingCount = await CampaignSubmissionModel.countDocuments({ status: 'pending' });
  const scheduledCount = await CampaignSubmissionModel.countDocuments({ status: 'scheduled' });
  
  const now = new Date();
  const activeSchedule = await CampaignScheduleModel.findOne({
    startDate: { $lte: now },
    endDate: { $gt: now },
  }).populate('submissionId').lean() as any;

  const activeCompanyName = activeSchedule?.submissionId?.companyName || 'None';

  // Recent Submissions
  const recentSubmissions = await CampaignSubmissionModel.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean() as any[];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Spotlight Administration</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border rounded-lg p-6 space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Pending Submissions</p>
          <p className="text-3xl font-bold">{pendingCount}</p>
        </div>
        <div className="bg-card border rounded-lg p-6 space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Scheduled Spotlights</p>
          <p className="text-3xl font-bold">{scheduledCount}</p>
        </div>
        <div className="bg-card border rounded-lg p-6 space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Active This Week</p>
          <p className="text-3xl font-bold">{activeCompanyName}</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-muted/50">
          <h2 className="font-semibold text-lg">Recent Submissions</h2>
          <input type="search" placeholder="Search..." className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors w-[300px]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Industry</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date Applied</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No submissions found.
                  </td>
                </tr>
              ) : (
                recentSubmissions.map((sub) => (
                  <tr key={sub._id.toString()} className="border-b hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">{sub.companyName}</td>
                    <td className="px-6 py-4">{sub.industry}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        sub.status === 'scheduled' ? 'bg-green-100 text-green-800' : 
                        'bg-muted text-muted-foreground'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(sub.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/spotlight/submissions/${sub._id.toString()}`} className="text-primary hover:underline font-medium">
                        {sub.status === 'pending' ? 'Review' : 'View'}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
