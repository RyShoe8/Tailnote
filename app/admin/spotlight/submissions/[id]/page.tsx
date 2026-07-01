import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { SubmissionActions } from './SubmissionActions';

export default async function SpotlightSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  await connectMongoose();
  const submission = (await CampaignSubmissionModel.findById(id).lean()) as any;
  
  if (!submission) {
    notFound();
  }

  const quote = (submission.content as any)?.quote || '';
  const whyShouldWeFeatureYou = (submission.content as any)?.whyShouldWeFeatureYou || '';

  const statusBadgeClass: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    voting: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    needs_changes: 'bg-orange-100 text-orange-800',
    rejected: 'bg-red-100 text-red-800',
    scheduled: 'bg-purple-100 text-purple-800',
    published: 'bg-emerald-100 text-emerald-800',
    archived: 'bg-muted text-muted-foreground',
  };
  const badgeClass =
    statusBadgeClass[submission.status as string] ?? 'bg-muted text-muted-foreground';

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <Link href="/admin/spotlight" className="text-sm text-muted-foreground hover:underline">
          ← Back to Submissions
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{submission.companyName}</h1>
            <a href={submission.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{submission.website}</a>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${badgeClass}`}>
            {String(submission.status).replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Application Details</h2>
            
            <div className="flex items-center gap-4 mb-4">
              {submission.logoUrl ? (
                <img src={submission.logoUrl} alt="Logo" className="w-16 h-16 rounded object-contain border bg-white" />
              ) : null}
              <div>
                <p className="font-semibold">{submission.founder}</p>
                <p className="text-sm text-muted-foreground">Founder</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Industry</p>
                <p>{submission.industry}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Company Size</p>
                <p>{submission.companySize}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground font-medium">Quote</p>
              <p className="italic">&quot;{quote}&quot;</p>
            </div>

            {submission.reviewerNotes ? (
              <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
                <p className="text-sm text-orange-900 font-medium">Reviewer notes</p>
                <p className="text-sm text-orange-800 mt-1 whitespace-pre-wrap">{submission.reviewerNotes}</p>
              </div>
            ) : null}

            {whyShouldWeFeatureYou ? (
              <div>
                <p className="text-sm text-muted-foreground font-medium">Why should we feature you?</p>
                <p>{whyShouldWeFeatureYou}</p>
              </div>
            ) : null}

            {submission.socialPlatforms && submission.socialPlatforms.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground font-medium">Social Profiles</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {submission.socialPlatforms.map((platform: string) => {
                    const url = submission.socialProfiles?.[platform] as string | undefined;
                    if (url) {
                      return (
                        <a key={platform} href={url} target="_blank" rel="noreferrer" className="px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 text-xs rounded capitalize transition">
                          {platform}
                        </a>
                      );
                    }
                    return (
                      <span key={platform} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded capitalize">
                        {platform}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* User Signature Profile Data */}
          {(submission.firstName || submission.lastName || submission.title || submission.email || submission.officePhone || submission.mobilePhone || submission.avatarUrl) ? (
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h2 className="font-semibold text-lg border-b pb-2">User Signature Profile</h2>
              
              <div className="flex items-center gap-4 mb-4">
                {submission.avatarUrl ? (
                  <img src={submission.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border bg-white" />
                ) : null}
                <div>
                  <p className="font-semibold">{submission.firstName} {submission.lastName}</p>
                  {submission.title && <p className="text-sm text-muted-foreground">{submission.title}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {submission.email ? (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Email</p>
                    <p><a href={`mailto:${submission.email}`} className="text-primary hover:underline">{submission.email}</a></p>
                  </div>
                ) : null}
                {submission.officePhone ? (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Office Phone</p>
                    <p>{submission.officePhone}</p>
                  </div>
                ) : null}
                {submission.mobilePhone ? (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Mobile Phone</p>
                    <p>{submission.mobilePhone}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Organization Brand Data */}
          {(submission.address || submission.city || submission.state || submission.zip || submission.primaryColor || submission.secondaryColor || submission.fontFamily || submission.logoLink || submission.logoShape || submission.logoHeightPx) ? (
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h2 className="font-semibold text-lg border-b pb-2">Organization Brand Details</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {submission.address ? (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground font-medium">Address</p>
                    <p>{submission.address}</p>
                  </div>
                ) : null}
                {submission.city ? (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">City</p>
                    <p>{submission.city}</p>
                  </div>
                ) : null}
                {submission.state ? (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">State</p>
                    <p>{submission.state}</p>
                  </div>
                ) : null}
                {submission.zip ? (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">ZIP</p>
                    <p>{submission.zip}</p>
                  </div>
                ) : null}
                {submission.logoLink ? (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground font-medium">Logo Link</p>
                    <p><a href={submission.logoLink} target="_blank" rel="noreferrer" className="text-primary hover:underline">{submission.logoLink}</a></p>
                  </div>
                ) : null}
                {submission.primaryColor ? (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Primary Color</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border" style={{ backgroundColor: submission.primaryColor }}></div>
                      <p className="text-xs font-mono">{submission.primaryColor}</p>
                    </div>
                  </div>
                ) : null}
                {submission.secondaryColor ? (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Secondary Color</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border" style={{ backgroundColor: submission.secondaryColor }}></div>
                      <p className="text-xs font-mono">{submission.secondaryColor}</p>
                    </div>
                  </div>
                ) : null}
                {submission.fontFamily ? (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Font Family</p>
                    <p>{submission.fontFamily}</p>
                  </div>
                ) : null}
                {submission.logoShape ? (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Logo Shape</p>
                    <p className="capitalize">{submission.logoShape}</p>
                  </div>
                ) : null}
                {submission.logoHeightPx ? (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Logo Height</p>
                    <p>{submission.logoHeightPx}px</p>
                  </div>
                ) : null}
              </div>

              {submission.animation?.enabled ? (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground font-medium">Animation</p>
                  <p className="text-sm">Enabled</p>
                  {submission.animation.gifUrl && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <a href={submission.animation.gifUrl} target="_blank" rel="noreferrer" className="hover:underline">View GIF</a>
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <SubmissionActions submissionId={id} hallOfFame={submission.hallOfFame} />
        </div>
      </div>
    </div>
  );
}
