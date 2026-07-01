import type { SignatureProfile } from 'emailsignature-engine';

export const defaultProfile: SignatureProfile = {
  firstName: '',
  lastName: '',
  title: '',
  email: '',
  officePhone: '',
  mobilePhone: '',
};

export function profileFromApi(sp: Partial<SignatureProfile> | null | undefined): SignatureProfile {
  if (!sp || typeof sp !== 'object') {
    return { ...defaultProfile };
  }
  return {
    ...defaultProfile,
    firstName: typeof sp.firstName === 'string' ? sp.firstName : '',
    lastName: typeof sp.lastName === 'string' ? sp.lastName : '',
    title: typeof sp.title === 'string' ? sp.title : '',
    email: typeof sp.email === 'string' ? sp.email : '',
    officePhone: typeof sp.officePhone === 'string' ? sp.officePhone : '',
    mobilePhone: typeof sp.mobilePhone === 'string' ? sp.mobilePhone : '',
    avatarUrl: typeof sp.avatarUrl === 'string' ? sp.avatarUrl : '',
    hiddenFields: Array.isArray(sp.hiddenFields) ? sp.hiddenFields : [],
    detailOrder: Array.isArray(sp.detailOrder) ? sp.detailOrder : [],
    contactDisplayOrder: Array.isArray(sp.contactDisplayOrder) ? sp.contactDisplayOrder : [],
  };
}

export function profileToPatchBody(
  profile: SignatureProfile,
  extras?: { contentBlocks?: unknown; templateId?: string },
): Record<string, unknown> {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    title: profile.title,
    email: profile.email,
    officePhone: profile.officePhone ?? '',
    mobilePhone: profile.mobilePhone ?? '',
    avatarUrl: profile.avatarUrl ?? '',
    hiddenFields: profile.hiddenFields ?? [],
    detailOrder: profile.detailOrder ?? [],
    contactDisplayOrder: profile.contactDisplayOrder ?? [],
    ...(extras?.contentBlocks !== undefined ? { contentBlocks: extras.contentBlocks } : {}),
    ...(extras?.templateId ? { templateId: extras.templateId } : {}),
  };
}

export function trackedProfilePayload(profile: SignatureProfile, contentBlocks: unknown) {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    title: profile.title,
    email: profile.email,
    officePhone: profile.officePhone ?? '',
    mobilePhone: profile.mobilePhone ?? '',
    avatarUrl: profile.avatarUrl ?? '',
    hiddenFields: profile.hiddenFields ?? [],
    detailOrder: profile.detailOrder ?? [],
    contactDisplayOrder: profile.contactDisplayOrder ?? [],
    contentBlocks,
  };
}
