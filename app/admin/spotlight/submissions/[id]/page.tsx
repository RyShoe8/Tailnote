import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectMongoose } from '@/lib/mongoose';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';
import { SubmissionActions } from './SubmissionActions';
import { formatVotingWeekLabel, getWeekStart } from '@/lib/campaigns/votingWeekUtils';
import { loadSubmitterSnapshotSources } from '@/lib/campaigns/loadSubmitterSnapshotSources';
import { resolveSubmissionSnapshot } from '@/lib/campaigns/resolveSubmissionSnapshot';
import {
  submissionStatusBadgeClass,
  submissionStatusLabel,
} from '@/lib/campaigns/submissionStatusDisplay';

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

function displayOrDash(value?: string | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return <span className="text-muted-foreground">—</span>;
  return text;
}

function ExternalLink({ href, label }: { href: string; label?: string }) {
  const text = label ?? href;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
      {text}
    </a>
  );
}

export default async function SpotlightSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await connectMongoose();
  const submission = (await CampaignSubmissionModel.findById(id).lean()) as any;

  if (!submission) {
    notFound();
  }

  const sources = await loadSubmitterSnapshotSources(submission.userId);
  const view = resolveSubmissionSnapshot({
    submission,
    org: sources.org,
    profile: sources.profile,
    employee: sources.employee,
    authUser: sources.authUser,
  });

  const content = (submission.content ?? {}) as {
    quote?: string;
    description?: string;
    whyShouldWeFeatureYou?: string;
  };
  const socialProfiles = (submission.socialProfiles ?? {}) as Record<string, string>;
  const socialEntries = Object.entries(socialProfiles).filter(([, url]) => typeof url === 'string' && url.trim());

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
    statusBadgeClass[submission.status as string] ?? submissionStatusBadgeClass(String(submission.status));
  const statusLabel = submissionStatusLabel(String(submission.status));

  const appliedAt = submission.createdAt
    ? new Date(submission.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';
  const votingWeekLabel = submission.votingStartDate
    ? formatVotingWeekLabel(getWeekStart(new Date(submission.votingStartDate)))
    : null;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <Link href="/admin/spotlight" className="text-sm text-muted-foreground hover:underline">
          ← Back to Submissions
        </Link>
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">{view.companyName || submission.companyName || 'Untitled submission'}</h1>
            {view.website ? (
              <ExternalLink href={view.website} />
            ) : (
              <span className="text-sm text-muted-foreground">No website provided</span>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium shrink-0 ${badgeClass}`}>
            {statusLabel}
          </span>
        </div>
        {submission.resubmittedAt ? (
          <p className="text-sm rounded-md border border-blue-200 bg-blue-50 text-blue-900 px-3 py-2">
            Applicant resubmitted on{' '}
            {new Date(submission.resubmittedAt).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
            .
          </p>
        ) : null}
        {view.usedLiveFallback ? (
          <p className="text-sm text-muted-foreground rounded-md border bg-muted/40 px-3 py-2">
            Some contact and brand fields were loaded from the applicant&apos;s current account because this
            submission predates full snapshot storage.
          </p>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Company</h2>

            <div className="flex items-start gap-4">
              {view.logoUrl ? (
                <img
                  src={view.logoUrl}
                  alt={`${view.companyName} logo`}
                  className="w-20 h-20 rounded object-contain border bg-white shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded border bg-muted/40 shrink-0" />
              )}
              <div className="grid sm:grid-cols-2 gap-4 flex-1">
                <DetailField label="Company name">{displayOrDash(view.companyName)}</DetailField>
                <DetailField label="Founder">{displayOrDash(submission.founder)}</DetailField>
                <DetailField label="Website">
                  {view.website ? <ExternalLink href={view.website} /> : displayOrDash(null)}
                </DetailField>
                <DetailField label="Logo URL">
                  {view.logoUrl ? <ExternalLink href={view.logoUrl} label="View logo" /> : displayOrDash(null)}
                </DetailField>
                <DetailField label="Industry">{displayOrDash(submission.industry)}</DetailField>
                <DetailField label="Company size">{displayOrDash(submission.companySize)}</DetailField>
                <DetailField label="Applied">{appliedAt}</DetailField>
                <DetailField label="Agreed to terms">
                  {submission.agreedToTerms ? 'Yes' : <span className="text-muted-foreground">No</span>}
                </DetailField>
                {votingWeekLabel ? (
                  <DetailField label="Scheduled voting week">{votingWeekLabel}</DetailField>
                ) : null}
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Spotlight content</h2>
            <DetailField label="Quote">
              {content.quote ? <p className="italic">&quot;{content.quote}&quot;</p> : displayOrDash(null)}
            </DetailField>
            <DetailField label="Description">
              {content.description ? (
                <p className="whitespace-pre-wrap">{content.description}</p>
              ) : (
                displayOrDash(null)
              )}
            </DetailField>
            <DetailField label="Why should we feature you?">
              {content.whyShouldWeFeatureYou ? (
                <p className="whitespace-pre-wrap">{content.whyShouldWeFeatureYou}</p>
              ) : (
                displayOrDash(null)
              )}
            </DetailField>

            {submission.reviewerNotes ? (
              <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
                <p className="text-sm text-orange-900 font-medium">Reviewer notes</p>
                <p className="text-sm text-orange-800 mt-1 whitespace-pre-wrap">{submission.reviewerNotes}</p>
              </div>
            ) : null}
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Social profiles</h2>
            {socialEntries.length > 0 ? (
              <ul className="space-y-2">
                {socialEntries.map(([platform, url]) => (
                  <li key={platform} className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-sm">
                    <span className="font-medium capitalize min-w-[7rem]">{platform}</span>
                    <ExternalLink href={url} />
                  </li>
                ))}
              </ul>
            ) : submission.socialPlatforms?.length ? (
              <div className="flex flex-wrap gap-2">
                {submission.socialPlatforms.map((platform: string) => (
                  <span
                    key={platform}
                    className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded capitalize"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Contact & signature profile</h2>
            <div className="flex items-start gap-4">
              {view.avatarUrl ? (
                <img
                  src={view.avatarUrl}
                  alt="Applicant avatar"
                  className="w-16 h-16 rounded-full object-cover border bg-white shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border bg-muted/40 shrink-0" />
              )}
              <div className="grid sm:grid-cols-2 gap-4 flex-1">
                <DetailField label="Name">
                  {[view.firstName, view.lastName].filter(Boolean).join(' ') || displayOrDash(null)}
                </DetailField>
                <DetailField label="Title">{displayOrDash(view.title)}</DetailField>
                <DetailField label="Email">
                  {view.email ? (
                    <a href={`mailto:${view.email}`} className="text-primary hover:underline break-all">
                      {view.email}
                    </a>
                  ) : (
                    displayOrDash(null)
                  )}
                </DetailField>
                <DetailField label="Avatar URL">
                  {view.avatarUrl ? (
                    <ExternalLink href={view.avatarUrl} label="View avatar" />
                  ) : (
                    displayOrDash(null)
                  )}
                </DetailField>
                <DetailField label="Office phone">{displayOrDash(view.officePhone)}</DetailField>
                <DetailField label="Mobile phone">{displayOrDash(view.mobilePhone)}</DetailField>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Brand details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <DetailField label="Address">{displayOrDash(view.address)}</DetailField>
              <DetailField label="City">{displayOrDash(view.city)}</DetailField>
              <DetailField label="State">{displayOrDash(view.state)}</DetailField>
              <DetailField label="ZIP">{displayOrDash(view.zip)}</DetailField>
              <DetailField label="Logo link">
                {view.logoLink ? <ExternalLink href={view.logoLink} /> : displayOrDash(null)}
              </DetailField>
              <DetailField label="Logo shape">
                {view.logoShape ? (
                  <span className="capitalize">{view.logoShape}</span>
                ) : (
                  displayOrDash(null)
                )}
              </DetailField>
              <DetailField label="Logo height">
                {view.logoHeightPx ? `${view.logoHeightPx}px` : displayOrDash(null)}
              </DetailField>
              <DetailField label="Font family">{displayOrDash(view.fontFamily)}</DetailField>
              <DetailField label="Primary color">
                {view.primaryColor ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border" style={{ backgroundColor: view.primaryColor }} />
                    <span className="font-mono text-xs">{view.primaryColor}</span>
                  </div>
                ) : (
                  displayOrDash(null)
                )}
              </DetailField>
              <DetailField label="Secondary color">
                {view.secondaryColor ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border" style={{ backgroundColor: view.secondaryColor }} />
                    <span className="font-mono text-xs">{view.secondaryColor}</span>
                  </div>
                ) : (
                  displayOrDash(null)
                )}
              </DetailField>
              <DetailField label="Animation">
                {view.animation?.enabled ? (
                  <span>
                    Enabled
                    {view.animation.gifUrl ? (
                      <>
                        {' '}
                        · <ExternalLink href={view.animation.gifUrl} label="View GIF" />
                      </>
                    ) : null}
                  </span>
                ) : (
                  displayOrDash(null)
                )}
              </DetailField>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-8">
          <SubmissionActions
            submissionId={id}
            hallOfFame={submission.hallOfFame}
            isVoteWinner={submission.isVoteWinner}
          />
        </div>
      </div>
    </div>
  );
}
