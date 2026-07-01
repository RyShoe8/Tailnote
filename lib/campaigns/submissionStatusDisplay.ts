export const SUBMISSION_STATUS_BADGE_CLASS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  voting: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  needs_changes: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
  scheduled: 'bg-purple-100 text-purple-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-muted text-muted-foreground',
};

export const SUBMISSION_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  voting: 'Voting',
  approved: 'Approved',
  needs_changes: 'Needs Changes',
  rejected: 'Rejected',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
};

export function submissionStatusLabel(status: string): string {
  return SUBMISSION_STATUS_LABEL[status] ?? status.replace(/_/g, ' ');
}

export function submissionStatusBadgeClass(status: string): string {
  return SUBMISSION_STATUS_BADGE_CLASS[status] ?? 'bg-muted text-muted-foreground';
}
