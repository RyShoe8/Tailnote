import type {
  RenderSignatureInput,
  SignatureBrand,
  SignatureProfile,
  SignatureTemplate,
  ContentBlockData,
} from 'emailsignature-engine';

/** App-side org brand fields that map into engine `SignatureBrand`. */
export type OrgBrandInput = {
  companyName: string;
  website: string;
  logoUrl: string;
  logoShape?: 'rectangle' | 'circle';
  logoLink?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  socialLinks: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    reddit?: string;
    discord?: string;
  };
  address?: string;
  state?: string;
  zip?: string;
  animation?: { enabled: boolean; gifUrl?: string };
  contentBlocks?: ContentBlockData[];
};

export type EmployeeProfileInput = {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  officePhone?: string;
  mobilePhone?: string;
};

export function toSignatureBrand(input: OrgBrandInput): SignatureBrand {
  return {
    companyName: input.companyName.trim(),
    website: input.website.trim(),
    logoUrl: input.logoUrl.trim(),
    logoShape: input.logoShape === 'circle' ? 'circle' : 'rectangle',
    logoLink: (input.logoLink ?? '').trim(),
    primaryColor: (input.primaryColor ?? '#0a0a0a').trim(),
    secondaryColor: (input.secondaryColor ?? '').trim(),
    fontFamily: (input.fontFamily ?? 'Arial').trim(),
    socialLinks: {
      linkedin: input.socialLinks.linkedin?.trim() || undefined,
      facebook: input.socialLinks.facebook?.trim() || undefined,
      instagram: input.socialLinks.instagram?.trim() || undefined,
      reddit: input.socialLinks.reddit?.trim() || undefined,
      discord: input.socialLinks.discord?.trim() || undefined,
    },
    address: input.address?.trim() || undefined,
    state: input.state?.trim() || undefined,
    zip: input.zip?.trim() || undefined,
    animation: {
      enabled: Boolean(input.animation?.enabled),
      gifUrl: input.animation?.gifUrl?.trim() || undefined,
    },
    contentBlocks: input.contentBlocks,
  };
}

export function toSignatureProfile(input: EmployeeProfileInput): SignatureProfile {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    title: input.title,
    email: input.email,
    officePhone: input.officePhone?.trim() || undefined,
    mobilePhone: input.mobilePhone?.trim() || undefined,
  };
}

export function buildRenderInput(args: {
  orgBrand: OrgBrandInput;
  employee: EmployeeProfileInput;
  template: SignatureTemplate;
  /** Passed to signature engine for absolute /images/... URLs in email HTML */
  publicSiteOrigin?: string;
  /** UTM config. false = disabled. undefined = use defaults. */
  utm?: { source: string; medium: string; campaign: string } | false;
}): RenderSignatureInput {
  const origin = args.publicSiteOrigin?.trim();
  return {
    profile: toSignatureProfile(args.employee),
    brand: toSignatureBrand(args.orgBrand),
    template: args.template,
    ...(origin ? { publicSiteOrigin: origin } : {}),
    ...(args.utm !== undefined ? { utm: args.utm } : {}),
  };
}
