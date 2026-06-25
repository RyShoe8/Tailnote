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

/** tailnote-logo-mark.png — keep in sync when regenerating via generate-transparent-logo.mjs */
const MARKETING_LOGO_INTRINSIC = { width: 619, height: 218 } as const;

/** Stored at 110px reference width for resolveLogoDisplayHeight scaling in the renderer. */
const MARKETING_LOGO_HEIGHT_PX = Math.round(
  (MARKETING_LOGO_INTRINSIC.height / MARKETING_LOGO_INTRINSIC.width) * 110
);

const BRAND_DATA = [
  {
    companyName: 'The Media Shop',
    website: 'themediashop.co',
    logoFile: 'themediashop-logo.png',
    emailDomain: 'themediashop.co',
    primaryColor: '#9B1C31',
  },
  {
    companyName: 'Nucleas',
    website: 'nucleas.app',
    logoFile: 'nucleas-logo.png',
    emailDomain: 'nucleas.app',
    primaryColor: '#4f46e5',
  },
  {
    companyName: 'Tailnote',
    website: 'tailnote.io',
    logoFile: 'tailnote-logo-mark.png',
    emailDomain: 'tailnote.io',
    primaryColor: '#2563eb',
  },
];

function getDemoBrandData(presetId: TemplatePresetId) {
  const PRESETS = [
    'default',
    'creator',
    'executive_minimalist',
    'minimal',
    'portfolio',
    'ecard',
    'professional',
    'modern_professional',
  ];
  let index = PRESETS.indexOf(presetId);
  if (index === -1) index = 0;
  return BRAND_DATA[index % 3];
}

function demoProfile(presetId: TemplatePresetId): SignatureProfile {
  const brand = getDemoBrandData(presetId);
  return {
    firstName: 'Alex',
    lastName: 'Morgan',
    title: 'Founder',
    email: `alex@${brand.emailDomain}`,
    officePhone: '123-456-7899',
    avatarUrl: presetId === 'modern_professional' ? 'https://ui-avatars.com/api/?name=Alex+Morgan&background=0D8ABC&color=fff&size=128' : undefined,
  };
}

function promoImageUrl(origin: string): string {
  return `${origin.replace(/\/+$/, '')}/images/tailnote-logo-mark.png`;
}

/** Marketing previews render without DB hydration — include resolved quote fields. */
function marketingQuoteBlock(quoteText: string, attribution: string): ContentBlockData {
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

/** Diversified promotional blocks per template so marketing previews showcase the product. */
function marketingContentBlocks(
  presetId: TemplatePresetId,
  origin: string
): ContentBlockData[] {
  const img = promoImageUrl(origin);

  switch (presetId) {
    case 'default':
      return [
        {
          type: 'list',
          enabled: true,
          listTitle: 'Business Tools',
          listItems: [
            { title: 'Nucleas', url: 'https://nucleas.app' },
            { title: 'The Media Shop', url: 'https://themediashop.co' },
            { title: 'Tailnote', url: 'https://tailnote.io' },
          ],
        },
      ];
    case 'creator':
      return [
        marketingQuoteBlock(
          'People do not buy what you do. They buy why you do it.',
          'Simon Sinek'
        ),
        {
          type: 'list',
          enabled: true,
          listItems: [
            { title: 'Nucleas', url: 'https://nucleas.app' },
            { title: 'The Media Shop', url: 'https://themediashop.co' },
            { title: 'Tailnote', url: 'https://tailnote.io' },
          ],
        },
      ];
    case 'executive_minimalist':
      return [
        {
          type: 'list',
          enabled: true,
          listTitle: 'Featured work',
          listItems: [
            { title: 'Nucleas', url: 'https://nucleas.app' },
            { title: 'The Media Shop', url: 'https://themediashop.co' },
            { title: 'Tailnote', url: 'https://tailnote.io' },
          ],
        },
        marketingQuoteBlock(
          "The best marketing doesn't feel like marketing.",
          'Tom Fishburne'
        ),
      ];
    case 'minimal':
      return [
        {
          type: 'book_a_call',
          enabled: true,
          callTitle: 'See a demo',
          callUrl: 'https://themediashop.co/demo',
          callButtonText: 'Book a call',
        },
        {
          type: 'list',
          enabled: true,
          listTitle: 'This week',
          listItems: [
            {
              title: 'Spring sale — 20% off',
              description: 'Ends Friday',
              url: 'https://themediashop.co/sale',
            },
            {
              title: 'Case study: Nucleas',
              url: 'https://nucleas.app/customers',
            },
          ],
        },
      ];
    case 'stacked':
      return [
        marketingQuoteBlock('The best marketing is helpful.', 'Tailnote'),
        {
          type: 'book_a_call',
          enabled: true,
          callTitle: 'Free workshop',
          callUrl: 'https://themediashop.co/workshop',
          callButtonText: 'Save your seat',
        },
      ];
    case 'corporate':
      return [
        marketingQuoteBlock(
          'People do not buy what you do. They buy why you do it.',
          'Simon Sinek'
        ),
        {
          type: 'latest_blogs',
          enabled: true,
          rssItems: [
            {
              title: 'How to launch a brand refresh in 30 days',
              url: 'https://themediashop.co/blog/brand-refresh',
            },
            {
              title: 'Inside our Q3 customer report',
              url: 'https://themediashop.co/blog/q3-report',
            },
            {
              title: 'Why every team email is marketing',
              url: 'https://tailnote.io/blog/email-marketing',
            },
          ],
        },
      ];
    case 'portfolio':
      return [
        {
          type: 'list',
          enabled: true,
          listTitle: 'Network Portfolio',
          listItems: [
            { title: 'Nucleas', url: 'https://nucleas.app' },
            { title: 'The Media Shop', url: 'https://themediashop.co' },
            { title: 'Tailnote', url: 'https://tailnote.io' },
          ],
        },
      ];
    case 'ecard':
      return [
        {
          type: 'list',
          enabled: true,
          listTitle: 'Portfolio',
          listItems: [
            { title: 'Nucleas', url: 'https://nucleas.app' },
            { title: 'The Media Shop', url: 'https://themediashop.co' },
            { title: 'Tailnote', url: 'https://tailnote.io' },
          ],
        },
      ];
    case 'professional':
      return [
        {
          type: 'book_a_call',
          enabled: true,
          callTitle: 'Talk to sales',
          callUrl: 'https://themediashop.co/contact',
          callButtonText: 'Get pricing',
        },
        {
          type: 'list',
          enabled: true,
          listTitle: 'Resources',
          listItems: [
            {
              title: 'ROI calculator',
              url: 'https://tailnote.io/roi',
            },
            {
              title: 'Customer stories',
              description: '12 industries',
              url: 'https://nucleas.app/stories',
            },
          ],
        },
        {
          type: 'image',
          enabled: true,
          imageUrl: img,
          imageLinkUrl: 'https://themediashop.co/spring',
        },
      ];
    case 'modern_professional':
      return [
        {
          type: 'book_a_call',
          enabled: true,
          callTitle: 'Let\'s Connect',
          callUrl: 'https://themediashop.co/contact',
          callButtonText: 'Book a meeting',
        },
        {
          type: 'list',
          enabled: true,
          listTitle: 'Latest work',
          listItems: [
            { title: 'Tailnote', url: 'https://tailnote.io' },
            { title: 'Nucleas', url: 'https://nucleas.app' },
          ],
        },
      ];
    default:
      return [
        {
          type: 'list',
          enabled: true,
          listTitle: 'Promotions',
          listItems: [{ title: 'See what’s new', url: 'https://themediashop.co' }],
        },
      ];
  }
}

function demoBrand(origin: string, presetId: TemplatePresetId): SignatureBrand {
  const brandData = getDemoBrandData(presetId);
  const logoUrl = `${origin.replace(/\/+$/, '')}/images/${brandData.logoFile}`;
  const isPortfolio = presetId === 'portfolio';
  const isEcard = presetId === 'ecard';
  return {
    companyName: brandData.companyName,
    website: brandData.website,
    logoUrl,
    logoLink: `https://${brandData.website}`,
    logoHeightPx: MARKETING_LOGO_HEIGHT_PX,
    primaryColor: isPortfolio ? '#1A3A34' : brandData.primaryColor,
    secondaryColor: isPortfolio ? '#E29578' : '',
    logoShape: 'rectangle',
    fontFamily: 'Arial',
    socialLinks: isEcard
      ? {
          linkedin: 'https://www.linkedin.com/company/example',
          reddit: 'https://www.reddit.com/user/example',
          discord: 'https://discord.gg/example',
          bluesky: 'https://bsky.app/profile/example.bsky.social',
        }
      : {
          linkedin: 'https://www.linkedin.com/company/example',
          facebook: 'https://www.facebook.com/example',
        },
    address: '123 Main St',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    animation: { enabled: false, gifUrl: '' },
    contentBlocks: marketingContentBlocks(presetId, origin),
  };
}

/** Renders a live signature HTML sample for marketing pages (server-only). */
export function renderMarketingSample(presetId: TemplatePresetId): string {
  const origin = getSignatureAssetOrigin();
  const vcardUrl =
    presetId === 'ecard' ? vcardDownloadUrl(origin, 'marketing-demo') : undefined;
  return renderSignature({
    profile: demoProfile(presetId),
    brand: demoBrand(origin, presetId),
    template: presetToEngineTemplate(presetId, `marketing-${presetId}`),
    publicSiteOrigin: origin,
    utm: MARKETING_UTM,
    ...(vcardUrl ? { vcardDownloadUrl: vcardUrl } : {}),
  });
}
