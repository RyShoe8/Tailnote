export type SignatureProfile = {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  officePhone?: string;
  mobilePhone?: string;
};

export type PromoUrlPrefix = 'https' | 'www';

export type ContentBlockListItem = {
  /** Optional when `url` or `description` alone should render (hostname used as link text when URL-only). */
  title?: string;
  description?: string;
  url?: string;
  /** Applied when url has no scheme: https:// (default) or www. → https://www. */
  urlPrefix?: PromoUrlPrefix;
};

export type ContentBlockData = {
  /** `custom` is kept for legacy reads; new blocks should use `list` or `image`. */
  type: 'book_a_call' | 'latest_blogs' | 'list' | 'image' | 'custom';
  enabled: boolean;
  // Book a call
  callTitle?: string;
  callUrl?: string;
  callButtonText?: string;
  // Latest blogs (RSS)
  rssUrl?: string;
  rssItems?: { title: string; url: string; imageUrl?: string; pubDate?: string }[];
  rssLastFetched?: string;
  rssRefreshInterval?: 'none' | 'daily' | 'weekly';
  // List (formerly custom)
  listTitle?: string;
  listItems?: ContentBlockListItem[];
  // Image
  imageUrl?: string;
  imageLinkUrl?: string;
  // Legacy custom fields (read-only fallback for older saved docs)
  customTitle?: string;
  customText?: string;
  customUrl?: string;
  customImageUrl?: string;
};

export type SignatureBrand = {
  companyName: string;
  website: string;
  logoUrl: string;
  /** Display height in px at fixed 110px width (Outlook); omit for default aspect. */
  logoHeightPx?: number;
  /** Org-wide logo crop: rectangle (default) or circle (square + border-radius). */
  logoShape?: 'rectangle' | 'circle';
  logoLink: string;
  primaryColor: string;
  /** Accent color for Portfolio template; falls back to primaryColor when empty. */
  secondaryColor?: string;
  fontFamily: string;
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
  animation?: {
    enabled: boolean;
    gifUrl?: string;
  };
  contentBlocks?: ContentBlockData[];
};

export type SignatureElement =
  | { type: 'logo' }
  | { type: 'name' }
  | { type: 'title' }
  | { type: 'contact' }
  | { type: 'social' }
  | { type: 'address' }
  | { type: 'divider' }
  | { type: 'animation' }
  | { type: 'contentBlocks' };

export type SignatureLayout =
  | 'standard'
  | 'stacked'
  | 'corporate'
  | 'professional'
  | 'default'
  | 'creator'
  | 'executive_minimalist'
  | 'portfolio'
  | 'ecard';

export type SignatureTemplate = {
  id: string;
  name: string;
  layout: SignatureLayout;
  elements: SignatureElement[];
};

export type RenderSignatureInput = {
  profile: SignatureProfile;
  brand: SignatureBrand;
  template: SignatureTemplate;
  /** Origin for resolving relative /images/... URLs (e.g. process.env.NEXT_PUBLIC_SITE_URL). */
  publicSiteOrigin?: string;
  /** UTM params to append to http/https links. false = disabled. */
  utm?: { source: string; medium: string; campaign: string } | false;
  /** Public URL for eCard Save Contact vCard download (omit for marketing samples). */
  vcardDownloadUrl?: string;
};
