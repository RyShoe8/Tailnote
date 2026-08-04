import {
  renderSignature,
  type ContentBlockData,
  type SignatureBrand,
  type SignatureProfile,
} from 'emailsignature-engine';
import { presetToEngineTemplate, type TemplatePresetId } from '@/lib/email/templatePresets';
import { getSignatureAssetOrigin } from '@/lib/siteOrigin';
import { vcardDownloadUrl } from '@/lib/vcard/vcardDownloadUrl';

const MARKETING_UTM = { source: 'Tailnote', medium: 'Email', campaign: 'Footer' } as const;

// ---------------------------------------------------------------------------
// 20 company brand definitions
// ---------------------------------------------------------------------------

type MarketingBrandDef = {
  companyName: string;
  website: string;
  logoFile: string;
  emailDomain: string;
  primaryColor: string;
  secondaryColor?: string;
  logoHeightPx: number;
  logoShape?: 'circle' | 'rectangle';
  fontFamily?: string;
  person: { firstName: string; lastName: string; title: string; phone: string };
  socialLinks: SignatureBrand['socialLinks'];
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  /** Which template preset this brand is assigned to */
  presetId: TemplatePresetId;
  contentBlocks: (origin: string) => ContentBlockData[];
};

/** Marketing previews render without DB hydration — include resolved quote fields. */
function quoteBlock(quoteText: string, attribution: string): ContentBlockData {
  return {
    type: 'quote',
    enabled: true,
    quoteSource: 'library',
    quoteShowAttribution: true,
    quoteAlignment: 'left',
    quoteFontSize: 'medium',
    quoteStyle: 'standard',
    quoteResolvedText: quoteText,
    quoteResolvedAttribution: attribution,
  };
}

const BRAND_DEFS: MarketingBrandDef[] = [
  // 1. Nucleas.app → Modern Professional
  {
    companyName: 'Nucleas',
    website: 'nucleas.app',
    logoFile: 'nucleas-logo.png',
    emailDomain: 'nucleas.app',
    primaryColor: '#4f46e5',
    logoHeightPx: 73,
    fontFamily: 'Inter, Arial, Helvetica, sans-serif',
    person: { firstName: 'Jordan', lastName: 'Ellis', title: 'Head of Product', phone: '(555) 201-4837' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/nucleas', youtube: 'https://www.youtube.com/@nucleas' },
    address: '200 Innovation Way', city: 'Austin', state: 'TX', zip: '78701',
    presetId: 'modern_professional',
    contentBlocks: () => [
      { type: 'book_a_call', enabled: true, callTitle: 'See a demo', callUrl: 'https://nucleas.app/demo', callButtonText: 'Book a meeting' },
      { type: 'list', enabled: true, listTitle: 'Latest work', listItems: [{ title: 'Open Platform API', url: 'https://nucleas.app/api' }, { title: 'Enterprise SSO', url: 'https://nucleas.app/sso' }] },
    ],
  },
  // 2. Playbound.club → Creator
  {
    companyName: 'Playbound',
    website: 'playbound.club',
    logoFile: 'marketing/playbound-logo.png',
    emailDomain: 'playbound.club',
    primaryColor: '#6D28D9',
    secondaryColor: '#A78BFA',
    logoHeightPx: 110,
    person: { firstName: 'Riley', lastName: 'Chen', title: 'Community Lead', phone: '(555) 308-7712' },
    socialLinks: { discord: 'https://discord.gg/playbound', youtube: 'https://www.youtube.com/@playbound', instagram: 'https://www.instagram.com/playbound' },
    presetId: 'creator',
    contentBlocks: () => [
      quoteBlock('Play is the highest form of research.', 'Albert Einstein'),
      { type: 'list', enabled: true, listItems: [{ title: 'Join our Discord', url: 'https://discord.gg/playbound' }, { title: 'Twitch Stream', url: 'https://twitch.tv/playbound' }] },
    ],
  },
  // 3. FrugalGambler.club → Portfolio
  {
    companyName: 'FrugalGambler',
    website: 'frugalgambler.club',
    logoFile: 'marketing/frugalgambler-logo.png',
    emailDomain: 'frugalgambler.club',
    primaryColor: '#064E3B',
    secondaryColor: '#34D399',
    logoHeightPx: 60,
    logoShape: 'circle',
    person: { firstName: 'Sam', lastName: 'Rivera', title: 'Founder', phone: '(555) 419-2203' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/frugalgambler', reddit: 'https://www.reddit.com/r/frugalgambler', bluesky: 'https://bsky.app/profile/frugalgambler.club' },
    presetId: 'portfolio',
    contentBlocks: () => [
      { type: 'list', enabled: true, listTitle: 'Network Portfolio', listItems: [{ title: 'Strategy Hub', url: 'https://frugalgambler.club/strategy' }, { title: 'Bankroll Tools', url: 'https://frugalgambler.club/tools' }, { title: 'Community Forum', url: 'https://frugalgambler.club/forum' }] },
    ],
  },
  // 4. TheMediaShop.co → Corporate
  {
    companyName: 'The Media Shop',
    website: 'themediashop.co',
    logoFile: 'themediashop-logo.png',
    emailDomain: 'themediashop.co',
    primaryColor: '#9B1C31',
    logoHeightPx: 57,
    person: { firstName: 'Casey', lastName: 'Park', title: 'Creative Director', phone: '(555) 622-8841' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/themediashop', facebook: 'https://www.facebook.com/themediashop', instagram: 'https://www.instagram.com/themediashop' },
    address: '500 Commerce St', city: 'Dallas', state: 'TX', zip: '75201',
    presetId: 'corporate',
    contentBlocks: () => [
      quoteBlock('People do not buy what you do. They buy why you do it.', 'Simon Sinek'),
      { type: 'latest_blogs', enabled: true, rssItems: [{ title: 'How to launch a brand refresh in 30 days', url: 'https://themediashop.co/blog/brand-refresh' }, { title: 'Why every team email is marketing', url: 'https://themediashop.co/blog/email-marketing' }] },
    ],
  },
  // 5. Tailnote.io → Default
  {
    companyName: 'Tailnote',
    website: 'tailnote.io',
    logoFile: 'tailnote-logo-mark.png',
    emailDomain: 'tailnote.io',
    primaryColor: '#2563EB',
    secondaryColor: '#60A5FA',
    logoHeightPx: 39,
    fontFamily: 'Inter, Arial, Helvetica, sans-serif',
    person: { firstName: 'Alex', lastName: 'Morgan', title: 'Founder', phone: '(555) 100-2748' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/tailnote', bluesky: 'https://bsky.app/profile/tailnote.io' },
    presetId: 'default',
    contentBlocks: () => [
      { type: 'list', enabled: true, listTitle: 'Business Tools', listItems: [{ title: 'Nucleas', url: 'https://nucleas.app' }, { title: 'The Media Shop', url: 'https://themediashop.co' }, { title: 'Tailnote', url: 'https://tailnote.io' }] },
    ],
  },
  // 6. Stripe → Professional
  {
    companyName: 'Stripe',
    website: 'stripe.com',
    logoFile: 'marketing/stripe-logo.png',
    emailDomain: 'stripe.com',
    primaryColor: '#635BFF',
    logoHeightPx: 110,
    fontFamily: "'Segoe UI', Tahoma, Geneva, sans-serif",
    person: { firstName: 'Taylor', lastName: 'Brooks', title: 'Solutions Architect', phone: '(555) 739-0156' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/stripe' },
    address: '354 Oyster Point Blvd', city: 'South San Francisco', state: 'CA', zip: '94080',
    presetId: 'professional',
    contentBlocks: () => [
      { type: 'book_a_call', enabled: true, callTitle: 'Talk to sales', callUrl: 'https://stripe.com/contact/sales', callButtonText: 'Get pricing' },
      { type: 'list', enabled: true, listTitle: 'Resources', listItems: [{ title: 'API Documentation', url: 'https://stripe.com/docs' }, { title: 'Customer stories', url: 'https://stripe.com/customers' }] },
    ],
  },
  // 7. Notion → Executive Minimalist
  {
    companyName: 'Notion',
    website: 'notion.so',
    logoFile: 'marketing/notion-logo.png',
    emailDomain: 'notion.so',
    primaryColor: '#191919',
    logoHeightPx: 110,
    fontFamily: "Georgia, 'Times New Roman', serif",
    person: { firstName: 'Morgan', lastName: 'Hayes', title: 'Head of Partnerships', phone: '(555) 882-1043' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/notion' },
    presetId: 'executive_minimalist',
    contentBlocks: () => [
      { type: 'list', enabled: true, listTitle: 'Featured work', listItems: [{ title: 'Notion for Teams', url: 'https://notion.so/teams' }, { title: 'Template Gallery', url: 'https://notion.so/templates' }] },
      quoteBlock("The best marketing doesn't feel like marketing.", 'Tom Fishburne'),
    ],
  },
  // 8. Linear → Minimal
  {
    companyName: 'Linear',
    website: 'linear.app',
    logoFile: 'marketing/linear-logo.png',
    emailDomain: 'linear.app',
    primaryColor: '#5E6AD2',
    logoHeightPx: 110,
    person: { firstName: 'Avery', lastName: 'Kim', title: 'Engineer', phone: '(555) 514-6690' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/linear' },
    presetId: 'minimal',
    contentBlocks: () => [
      { type: 'book_a_call', enabled: true, callTitle: 'Try Linear', callUrl: 'https://linear.app/signup', callButtonText: 'Start free' },
    ],
  },
  // 9. Figma → Stacked
  {
    companyName: 'Figma',
    website: 'figma.com',
    logoFile: 'marketing/figma-logo.png',
    emailDomain: 'figma.com',
    primaryColor: '#0ACF83',
    logoHeightPx: 110,
    person: { firstName: 'Quinn', lastName: 'Torres', title: 'Design Advocate', phone: '(555) 273-5518' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/figma', youtube: 'https://www.youtube.com/@figma' },
    presetId: 'stacked',
    contentBlocks: () => [
      quoteBlock('Design is not just what it looks like. Design is how it works.', 'Steve Jobs'),
      { type: 'book_a_call', enabled: true, callTitle: 'Config 2026', callUrl: 'https://config.figma.com', callButtonText: 'Register now' },
    ],
  },
  // 10. Vercel → Modern Professional
  {
    companyName: 'Vercel',
    website: 'vercel.com',
    logoFile: 'marketing/vercel-logo.png',
    emailDomain: 'vercel.com',
    primaryColor: '#000000',
    logoHeightPx: 110,
    person: { firstName: 'Drew', lastName: 'Nakamura', title: 'DevRel Lead', phone: '(555) 647-3301' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/vercel', bluesky: 'https://bsky.app/profile/vercel.com' },
    presetId: 'modern_professional',
    contentBlocks: () => [
      { type: 'book_a_call', enabled: true, callTitle: 'Ship faster', callUrl: 'https://vercel.com/contact', callButtonText: 'Talk to us' },
      { type: 'list', enabled: true, listTitle: 'Resources', listItems: [{ title: 'Next.js Docs', url: 'https://nextjs.org/docs' }, { title: 'Vercel Blog', url: 'https://vercel.com/blog' }] },
    ],
  },
  // 11. Intercom → Corporate
  {
    companyName: 'Intercom',
    website: 'intercom.com',
    logoFile: 'marketing/intercom-logo.png',
    emailDomain: 'intercom.com',
    primaryColor: '#286EFA',
    logoHeightPx: 110,
    person: { firstName: 'Blair', lastName: 'Sullivan', title: 'Customer Success Manager', phone: '(555) 985-4427' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/intercom', facebook: 'https://www.facebook.com/intercom' },
    address: '55 2nd St', city: 'San Francisco', state: 'CA', zip: '94105',
    presetId: 'corporate',
    contentBlocks: () => [
      quoteBlock('Customer service shouldn\'t just be a department. It should be the entire company.', 'Tony Hsieh'),
      { type: 'list', enabled: true, listTitle: 'Resources', listItems: [{ title: 'Intercom Academy', url: 'https://intercom.com/academy' }, { title: 'Help Center', url: 'https://intercom.com/help' }] },
    ],
  },
  // 12. Loom → Creator
  {
    companyName: 'Loom',
    website: 'loom.com',
    logoFile: 'marketing/loom-logo.png',
    emailDomain: 'loom.com',
    primaryColor: '#625DF5',
    secondaryColor: '#A29BFE',
    logoHeightPx: 110,
    person: { firstName: 'Skylar', lastName: 'Patel', title: 'Content Creator', phone: '(555) 332-7156' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/loom', youtube: 'https://www.youtube.com/@loom', instagram: 'https://www.instagram.com/laborofloom' },
    presetId: 'creator',
    contentBlocks: () => [
      quoteBlock('A minute of video is worth 1.8 million words.', 'Forrester Research'),
      { type: 'list', enabled: true, listItems: [{ title: 'Record a Loom', url: 'https://loom.com/record' }, { title: 'Chrome Extension', url: 'https://loom.com/download' }] },
    ],
  },
  // 13. Calendly → eCard
  {
    companyName: 'Calendly',
    website: 'calendly.com',
    logoFile: 'marketing/calendly-logo.png',
    emailDomain: 'calendly.com',
    primaryColor: '#006BFF',
    logoHeightPx: 110,
    person: { firstName: 'Reese', lastName: 'Okafor', title: 'Account Executive', phone: '(555) 760-1194' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/calendly', bluesky: 'https://bsky.app/profile/calendly.com' },
    presetId: 'ecard',
    contentBlocks: () => [
      { type: 'list', enabled: true, listTitle: 'Schedule with me', listItems: [{ title: 'Quick 15-min chat', url: 'https://calendly.com/d/reese-15' }, { title: 'Product walkthrough', url: 'https://calendly.com/d/reese-demo' }] },
    ],
  },
  // 14. Airtable → Professional
  {
    companyName: 'Airtable',
    website: 'airtable.com',
    logoFile: 'marketing/airtable-logo.png',
    emailDomain: 'airtable.com',
    primaryColor: '#18BFFF',
    logoHeightPx: 110,
    person: { firstName: 'Jamie', lastName: 'Nguyen', title: 'Product Manager', phone: '(555) 448-5593' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/airtable', youtube: 'https://www.youtube.com/@airtable' },
    presetId: 'professional',
    contentBlocks: () => [
      { type: 'book_a_call', enabled: true, callTitle: 'See Airtable in action', callUrl: 'https://airtable.com/demo', callButtonText: 'Book a demo' },
      { type: 'list', enabled: true, listTitle: 'Templates', listItems: [{ title: 'Product Launch', url: 'https://airtable.com/templates/product-launch' }, { title: 'Content Calendar', url: 'https://airtable.com/templates/content-calendar' }] },
    ],
  },
  // 15. Webflow → Default
  {
    companyName: 'Webflow',
    website: 'webflow.com',
    logoFile: 'marketing/webflow-logo.png',
    emailDomain: 'webflow.com',
    primaryColor: '#4353FF',
    secondaryColor: '#7B8BFF',
    logoHeightPx: 110,
    person: { firstName: 'Dakota', lastName: 'Reeves', title: 'Solutions Engineer', phone: '(555) 597-2260' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/webflow', youtube: 'https://www.youtube.com/@webflow' },
    presetId: 'default',
    contentBlocks: () => [
      { type: 'list', enabled: true, listTitle: 'Build with us', listItems: [{ title: 'Webflow University', url: 'https://university.webflow.com' }, { title: 'Templates', url: 'https://webflow.com/templates' }, { title: 'Enterprise', url: 'https://webflow.com/enterprise' }] },
    ],
  },
  // 16. Descript → Creator
  {
    companyName: 'Descript',
    website: 'descript.com',
    logoFile: 'marketing/descript-logo.png',
    emailDomain: 'descript.com',
    primaryColor: '#1A1A2E',
    secondaryColor: '#00D4AA',
    logoHeightPx: 110,
    person: { firstName: 'Emery', lastName: 'Walsh', title: 'Video Editor', phone: '(555) 856-3347' },
    socialLinks: { youtube: 'https://www.youtube.com/@descript', instagram: 'https://www.instagram.com/descript' },
    presetId: 'creator',
    contentBlocks: () => [
      quoteBlock('The best stories are the ones you can edit.', 'Descript Team'),
      { type: 'list', enabled: true, listItems: [{ title: 'Podcast Studio', url: 'https://descript.com/podcasting' }, { title: 'Screen Recorder', url: 'https://descript.com/screen-recorder' }] },
    ],
  },
  // 17. Superhuman → Executive Minimalist
  {
    companyName: 'Superhuman',
    website: 'superhuman.com',
    logoFile: 'marketing/superhuman-logo.png',
    emailDomain: 'superhuman.com',
    primaryColor: '#6C63FF',
    logoHeightPx: 110,
    fontFamily: "Georgia, 'Times New Roman', serif",
    person: { firstName: 'Rowan', lastName: 'Carr', title: 'VP of Growth', phone: '(555) 123-9087' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/superhuman' },
    presetId: 'executive_minimalist',
    contentBlocks: () => [
      { type: 'list', enabled: true, listTitle: 'Featured', listItems: [{ title: 'Get Superhuman', url: 'https://superhuman.com/download' }, { title: 'Enterprise', url: 'https://superhuman.com/enterprise' }] },
    ],
  },
  // 18. Pitch → Portfolio
  {
    companyName: 'Pitch',
    website: 'pitch.com',
    logoFile: 'marketing/pitch-logo.png',
    emailDomain: 'pitch.com',
    primaryColor: '#121228',
    secondaryColor: '#7C5CFC',
    logoHeightPx: 110,
    logoShape: 'circle',
    person: { firstName: 'Sage', lastName: 'Fischer', title: 'Brand Director', phone: '(555) 941-6672' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/pitch', instagram: 'https://www.instagram.com/pitch' },
    presetId: 'portfolio',
    contentBlocks: () => [
      { type: 'list', enabled: true, listTitle: 'Network Portfolio', listItems: [{ title: 'Pitch Templates', url: 'https://pitch.com/templates' }, { title: 'Presentation AI', url: 'https://pitch.com/ai' }] },
    ],
  },
  // 19. Coda → Stacked
  {
    companyName: 'Coda',
    website: 'coda.io',
    logoFile: 'marketing/coda-logo.png',
    emailDomain: 'coda.io',
    primaryColor: '#F46A54',
    logoHeightPx: 110,
    person: { firstName: 'Finley', lastName: 'Duarte', title: 'Product Lead', phone: '(555) 204-7738' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/coda', youtube: 'https://www.youtube.com/@coda' },
    presetId: 'stacked',
    contentBlocks: () => [
      quoteBlock('All-in-one docs for teams.', 'Coda'),
      { type: 'book_a_call', enabled: true, callTitle: 'See Coda in action', callUrl: 'https://coda.io/demo', callButtonText: 'Get a demo' },
    ],
  },
  // 20. Retool → Minimal
  {
    companyName: 'Retool',
    website: 'retool.com',
    logoFile: 'marketing/retool-logo.png',
    emailDomain: 'retool.com',
    primaryColor: '#3D3D3D',
    logoHeightPx: 110,
    person: { firstName: 'Harley', lastName: 'Lam', title: 'Developer Advocate', phone: '(555) 678-4412' },
    socialLinks: { linkedin: 'https://www.linkedin.com/company/retool' },
    presetId: 'minimal',
    contentBlocks: () => [
      { type: 'book_a_call', enabled: true, callTitle: 'Build internal tools fast', callUrl: 'https://retool.com/demo', callButtonText: 'Try Retool free' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Map from presetId → brand defs that are assigned to it */
const BRAND_BY_PRESET = new Map<TemplatePresetId, MarketingBrandDef[]>();
for (const def of BRAND_DEFS) {
  const list = BRAND_BY_PRESET.get(def.presetId) ?? [];
  list.push(def);
  BRAND_BY_PRESET.set(def.presetId, list);
}

/** Get the best brand def for a given preset. Falls back to the first brand. */
function getBrandDef(presetId: TemplatePresetId, index = 0): MarketingBrandDef {
  const matches = BRAND_BY_PRESET.get(presetId);
  if (matches && matches.length > 0) {
    return matches[index % matches.length]!;
  }
  // Fallback: first brand def
  return BRAND_DEFS[0]!;
}

// ---------------------------------------------------------------------------
// Profile + Brand builders
// ---------------------------------------------------------------------------

function buildProfile(def: MarketingBrandDef, presetId: TemplatePresetId): SignatureProfile {
  return {
    firstName: def.person.firstName,
    lastName: def.person.lastName,
    title: def.person.title,
    email: `${def.person.firstName.toLowerCase()}@${def.emailDomain}`,
    officePhone: def.person.phone,
    avatarUrl: presetId === 'modern_professional' ? `https://i.pravatar.cc/150?u=${def.emailDomain}` : undefined,
  };
}

function buildBrand(def: MarketingBrandDef, origin: string): SignatureBrand {
  const logoUrl = `${origin.replace(/\/+$/, '')}/images/${def.logoFile}`;
  return {
    companyName: def.companyName,
    website: def.website,
    logoUrl,
    logoLink: `https://${def.website}`,
    logoHeightPx: def.logoHeightPx,
    logoShape: def.logoShape ?? 'rectangle',
    primaryColor: def.primaryColor,
    secondaryColor: def.secondaryColor ?? '',
    fontFamily: def.fontFamily ?? 'Arial',
    socialLinks: def.socialLinks,
    address: def.address,
    city: def.city,
    state: def.state,
    zip: def.zip,
    animation: { enabled: false, gifUrl: '' },
    contentBlocks: def.contentBlocks(origin),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Renders a live signature HTML sample for marketing pages (server-only). */
export function renderMarketingSample(presetId: TemplatePresetId, brandIndex = 0): string {
  const origin = getSignatureAssetOrigin();
  const def = getBrandDef(presetId, brandIndex);
  const vcardUrl = presetId === 'ecard' ? vcardDownloadUrl(origin, 'marketing-demo') : undefined;
  return renderSignature({
    profile: buildProfile(def, presetId),
    brand: buildBrand(def, origin),
    template: presetToEngineTemplate(presetId, `marketing-${presetId}-${brandIndex}`),
    publicSiteOrigin: origin,
    utm: MARKETING_UTM,
    ...(vcardUrl ? { vcardDownloadUrl: vcardUrl } : {}),
  });
}

/** All 20 brand definitions (for use in marketing pages that want to show all examples). */
export function getAllMarketingBrandDefs() {
  return BRAND_DEFS;
}

/** Renders a live signature HTML sample for spotlight pages with a custom quote (server-only). */
export function renderSpotlightSample(quote: string, companyName: string, presetId: TemplatePresetId = 'modern_professional'): string {
  const origin = getSignatureAssetOrigin();
  const def = getBrandDef(presetId);
  const brand = buildBrand(def, origin);

  // Replace the default content blocks with just the spotlight quote block
  brand.contentBlocks = [quoteBlock(quote, companyName)];

  return renderSignature({
    profile: buildProfile(def, presetId),
    brand,
    template: presetToEngineTemplate(presetId, `spotlight-mock-${presetId}`),
    publicSiteOrigin: origin,
    utm: MARKETING_UTM,
  });
}
