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

const DEMO_PROFILE: SignatureProfile = {
  firstName: 'Alex',
  lastName: 'Morgan',
  title: 'Founder',
  email: 'myemail@themediashop.co',
  officePhone: '123-456-7899',
};

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
            { title: 'Nucleas', url: 'https://www.acmecorp.com/nucleas' },
            { title: 'The Ad Shop', url: 'https://www.acmecorp.com/ad-shop' },
            { title: 'Tailnote', url: 'https://www.acmecorp.com/tailnote' },
          ],
        },
        {
          type: 'list',
          enabled: true,
          listTitle: 'Content Sites',
          listItems: [
            { title: 'The Frugal Gambler', url: 'https://www.acmecorp.com/frugal' },
            { title: 'DocSpot', url: 'https://www.acmecorp.com/docspot' },
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
            { title: 'Nucleas', url: 'https://www.acmecorp.com/nucleas' },
            { title: 'The Ad Shop', url: 'https://www.acmecorp.com/ad-shop' },
            { title: 'Tailnote', url: 'https://www.acmecorp.com/tailnote' },
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
            { title: 'Nucleas', url: 'https://www.acmecorp.com/nucleas' },
            { title: 'The Ad Shop', url: 'https://www.acmecorp.com/ad-shop' },
            { title: 'Tailnote', url: 'https://www.acmecorp.com/tailnote' },
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
          callUrl: 'https://www.acmecorp.com/demo',
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
              url: 'https://www.acmecorp.com/sale',
            },
            {
              title: 'Case study: Northwind',
              url: 'https://www.acmecorp.com/customers',
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
          callUrl: 'https://www.acmecorp.com/workshop',
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
              url: 'https://www.acmecorp.com/blog/brand-refresh',
            },
            {
              title: 'Inside our Q3 customer report',
              url: 'https://www.acmecorp.com/blog/q3-report',
            },
            {
              title: 'Why every team email is marketing',
              url: 'https://www.acmecorp.com/blog/email-marketing',
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
            { title: 'Nucleas', url: 'https://www.acmecorp.com/nucleas' },
            { title: 'The Ad Shop', url: 'https://www.acmecorp.com/ad-shop' },
            { title: 'Tailnote', url: 'https://www.acmecorp.com/tailnote' },
            { title: 'The Frugal Gambler', url: 'https://www.acmecorp.com/frugal' },
            { title: 'DocSpot', url: 'https://www.acmecorp.com/docspot' },
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
            { title: 'Nucleas', url: 'https://www.acmecorp.com/nucleas' },
            { title: 'The Ad Shop', url: 'https://www.acmecorp.com/ad-shop' },
            { title: 'Tailnote', url: 'https://www.acmecorp.com/tailnote' },
            { title: 'The Frugal Gambler', url: 'https://www.acmecorp.com/frugal' },
            { title: 'DocSpot', url: 'https://www.acmecorp.com/docspot' },
          ],
        },
      ];
    case 'professional':
      return [
        {
          type: 'book_a_call',
          enabled: true,
          callTitle: 'Talk to sales',
          callUrl: 'https://www.acmecorp.com/contact',
          callButtonText: 'Get pricing',
        },
        {
          type: 'list',
          enabled: true,
          listTitle: 'Resources',
          listItems: [
            {
              title: 'ROI calculator',
              url: 'https://www.acmecorp.com/roi',
            },
            {
              title: 'Customer stories',
              description: '12 industries',
              url: 'https://www.acmecorp.com/stories',
            },
          ],
        },
        {
          type: 'image',
          enabled: true,
          imageUrl: img,
          imageLinkUrl: 'https://www.acmecorp.com/spring',
        },
      ];
    default:
      return [
        {
          type: 'list',
          enabled: true,
          listTitle: 'Promotions',
          listItems: [{ title: 'See what’s new', url: 'https://www.acmecorp.com' }],
        },
      ];
  }
}

function demoBrand(origin: string, presetId: TemplatePresetId): SignatureBrand {
  const logoUrl = promoImageUrl(origin);
  const isPortfolio = presetId === 'portfolio';
  const isEcard = presetId === 'ecard';
  const isMediaShop = isPortfolio || isEcard;
  return {
    companyName: isMediaShop ? 'The Media Shop' : 'Acme Corp',
    website: isMediaShop ? 'themediashop.co' : 'www.acmecorp.com',
    logoUrl,
    logoLink: 'https://www.acmecorp.com',
    logoHeightPx: MARKETING_LOGO_HEIGHT_PX,
    primaryColor: isPortfolio ? '#1A3A34' : isEcard ? '#4F46E5' : '#2563eb',
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
    profile: DEMO_PROFILE,
    brand: demoBrand(origin, presetId),
    template: presetToEngineTemplate(presetId, `marketing-${presetId}`),
    publicSiteOrigin: origin,
    utm: MARKETING_UTM,
    ...(vcardUrl ? { vcardDownloadUrl: vcardUrl } : {}),
  });
}
