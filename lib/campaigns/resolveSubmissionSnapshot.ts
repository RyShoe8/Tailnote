import { orgToBrandInput } from '@/lib/renderEmployeeSignature';
import type { OrganizationDoc } from '@/models/Organization';

export type SubmissionSnapshotInput = {
  companyName?: string;
  website?: string;
  logoUrl?: string;
  founder?: string;
  industry?: string;
  companySize?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
  officePhone?: string;
  mobilePhone?: string;
  avatarUrl?: string;
  logoHeightPx?: number;
  logoShape?: 'rectangle' | 'circle';
  logoLink?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  animation?: { enabled?: boolean; gifUrl?: string };
  content?: unknown;
  socialPlatforms?: string[];
  socialProfiles?: Record<string, string>;
  agreedToTerms?: boolean;
  templateId?: string;
  brandOrder?: string[];
  hiddenFields?: string[];
  detailOrder?: string[];
  contactDisplayOrder?: string[];
  contentBlocks?: unknown[];
};

export type ProfileSource = {
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
  officePhone?: string;
  mobilePhone?: string;
  avatarUrl?: string;
};

export type AuthUserSource = {
  email?: string;
  name?: string | null;
};

export type ResolvedSubmissionSnapshot = SubmissionSnapshotInput & {
  usedLiveFallback: boolean;
};

const PROFILE_SNAPSHOT_KEYS = [
  'firstName',
  'lastName',
  'title',
  'email',
  'officePhone',
  'mobilePhone',
  'avatarUrl',
] as const;

const BRAND_SNAPSHOT_KEYS = [
  'logoHeightPx',
  'logoShape',
  'logoLink',
  'primaryColor',
  'secondaryColor',
  'fontFamily',
  'address',
  'city',
  'state',
  'zip',
  'animation',
] as const;

export function pickNonEmpty(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

export function splitFounderName(founder?: string): { firstName: string; lastName: string } {
  const trimmed = typeof founder === 'string' ? founder.trim() : '';
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function submissionHasProfileSnapshot(submission: SubmissionSnapshotInput): boolean {
  return PROFILE_SNAPSHOT_KEYS.some((key) => isNonEmptyString(submission[key]));
}

function submissionHasBrandSnapshot(submission: SubmissionSnapshotInput): boolean {
  if (typeof submission.logoHeightPx === 'number' && submission.logoHeightPx > 0) {
    return true;
  }
  return BRAND_SNAPSHOT_KEYS.some((key) => {
    if (key === 'logoHeightPx' || key === 'animation') return false;
    return isNonEmptyString(submission[key as keyof SubmissionSnapshotInput]);
  });
}

export function orgBrandFields(org: OrganizationDoc): Pick<
  SubmissionSnapshotInput,
  | 'logoHeightPx'
  | 'logoShape'
  | 'logoLink'
  | 'primaryColor'
  | 'secondaryColor'
  | 'fontFamily'
  | 'address'
  | 'city'
  | 'state'
  | 'zip'
  | 'animation'
> {
  const brand = orgToBrandInput(org);
  return {
    logoHeightPx: brand.logoHeightPx,
    logoShape: brand.logoShape,
    logoLink: brand.logoLink ?? '',
    primaryColor: brand.primaryColor ?? '#0a0a0a',
    secondaryColor: brand.secondaryColor ?? '',
    fontFamily: brand.fontFamily ?? 'Arial',
    address: brand.address ?? '',
    city: brand.city ?? '',
    state: brand.state ?? '',
    zip: brand.zip ?? '',
    animation: brand.animation ?? { enabled: false, gifUrl: '' },
  };
}

function profileFromSources(
  submission: SubmissionSnapshotInput,
  profile?: ProfileSource | null,
  employee?: ProfileSource | null,
  authUser?: AuthUserSource | null,
): Pick<
  SubmissionSnapshotInput,
  'firstName' | 'lastName' | 'title' | 'email' | 'officePhone' | 'mobilePhone' | 'avatarUrl'
> {
  const fromFounder = splitFounderName(submission.founder);
  const authName = splitFounderName(authUser?.name ?? undefined);

  return {
    firstName: pickNonEmpty(submission.firstName, profile?.firstName, employee?.firstName, fromFounder.firstName, authName.firstName),
    lastName: pickNonEmpty(submission.lastName, profile?.lastName, employee?.lastName, fromFounder.lastName, authName.lastName),
    title: pickNonEmpty(submission.title, profile?.title, employee?.title),
    email: pickNonEmpty(submission.email, profile?.email, employee?.email, authUser?.email),
    officePhone: pickNonEmpty(submission.officePhone, profile?.officePhone, employee?.officePhone),
    mobilePhone: pickNonEmpty(submission.mobilePhone, profile?.mobilePhone, employee?.mobilePhone),
    avatarUrl: pickNonEmpty(submission.avatarUrl, profile?.avatarUrl, employee?.avatarUrl),
  };
}

function brandFromSources(
  submission: SubmissionSnapshotInput,
  org?: OrganizationDoc | null,
): Pick<
  SubmissionSnapshotInput,
  | 'logoHeightPx'
  | 'logoShape'
  | 'logoLink'
  | 'primaryColor'
  | 'secondaryColor'
  | 'fontFamily'
  | 'address'
  | 'city'
  | 'state'
  | 'zip'
  | 'animation'
> {
  const orgBrand = org ? orgBrandFields(org) : null;

  return {
    logoHeightPx: submission.logoHeightPx ?? orgBrand?.logoHeightPx,
    logoShape: submission.logoShape ?? orgBrand?.logoShape,
    logoLink: pickNonEmpty(submission.logoLink, orgBrand?.logoLink),
    primaryColor: pickNonEmpty(submission.primaryColor, orgBrand?.primaryColor),
    secondaryColor: pickNonEmpty(submission.secondaryColor, orgBrand?.secondaryColor),
    fontFamily: pickNonEmpty(submission.fontFamily, orgBrand?.fontFamily),
    address: pickNonEmpty(submission.address, orgBrand?.address),
    city: pickNonEmpty(submission.city, orgBrand?.city),
    state: pickNonEmpty(submission.state, orgBrand?.state),
    zip: pickNonEmpty(submission.zip, orgBrand?.zip),
    animation: submission.animation?.enabled || submission.animation?.gifUrl
      ? submission.animation
      : orgBrand?.animation,
  };
}

export function resolveSubmissionSnapshot(args: {
  submission: SubmissionSnapshotInput;
  org?: OrganizationDoc | null;
  profile?: ProfileSource | null;
  employee?: ProfileSource | null;
  authUser?: AuthUserSource | null;
}): ResolvedSubmissionSnapshot {
  const { submission, org, profile, employee, authUser } = args;
  const mergedProfile = profileFromSources(submission, profile, employee, authUser);
  const mergedBrand = brandFromSources(submission, org);

  const usedLiveFallback =
    (!submissionHasProfileSnapshot(submission) &&
      PROFILE_SNAPSHOT_KEYS.some((key) => isNonEmptyString(mergedProfile[key]))) ||
    (!submissionHasBrandSnapshot(submission) &&
      BRAND_SNAPSHOT_KEYS.some((key) => {
        const value = mergedBrand[key as keyof typeof mergedBrand];
        if (key === 'animation') {
          return Boolean(
            (value as { enabled?: boolean; gifUrl?: string } | undefined)?.enabled ||
              (value as { enabled?: boolean; gifUrl?: string } | undefined)?.gifUrl,
          );
        }
        if (key === 'logoHeightPx') {
          return typeof value === 'number' && value > 0;
        }
        return isNonEmptyString(value);
      }));

  return {
    ...submission,
    companyName: pickNonEmpty(submission.companyName, org?.companyName, org?.name) || submission.companyName,
    website: pickNonEmpty(submission.website, org?.website) || submission.website,
    logoUrl: pickNonEmpty(submission.logoUrl, org?.logoUrl) || submission.logoUrl,
    ...mergedProfile,
    ...mergedBrand,
    usedLiveFallback,
  };
}

/** Snapshot fields to persist on create — merges client apply payload with resolved profile/brand. */
export function buildSubmissionCreatePayload(
  client: SubmissionSnapshotInput,
  resolved: ResolvedSubmissionSnapshot,
): Omit<ResolvedSubmissionSnapshot, 'usedLiveFallback'> {
  return {
    companyName: resolved.companyName ?? client.companyName,
    website: resolved.website ?? client.website,
    logoUrl: resolved.logoUrl ?? client.logoUrl,
    founder: client.founder,
    industry: client.industry,
    companySize: client.companySize,
    firstName: resolved.firstName,
    lastName: resolved.lastName,
    title: resolved.title,
    email: resolved.email,
    officePhone: resolved.officePhone,
    mobilePhone: resolved.mobilePhone,
    avatarUrl: resolved.avatarUrl,
    logoHeightPx: resolved.logoHeightPx,
    logoShape: resolved.logoShape,
    logoLink: resolved.logoLink,
    primaryColor: resolved.primaryColor,
    secondaryColor: resolved.secondaryColor,
    fontFamily: resolved.fontFamily,
    address: resolved.address,
    city: resolved.city,
    state: resolved.state,
    zip: resolved.zip,
    animation: resolved.animation,
    content: client.content,
    socialPlatforms: client.socialPlatforms,
    socialProfiles: client.socialProfiles,
    agreedToTerms: client.agreedToTerms,
    templateId: client.templateId,
    brandOrder: client.brandOrder,
    hiddenFields: client.hiddenFields,
    detailOrder: client.detailOrder,
    contactDisplayOrder: client.contactDisplayOrder,
    contentBlocks: client.contentBlocks,
  };
}
