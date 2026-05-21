/**
 * Automated structural checks for Gmail / Outlook / Apple Mail friendly markup.
 * Still paste-test in real clients after deploy (images load, compose quirks).
 */
import assert from 'node:assert/strict';
import { renderSignature } from '../src/index';
import { mockSignatureBrand, mockSignatureTemplate } from '../src/fixtures';

const profile = {
  firstName: 'Test',
  lastName: 'User',
  title: 'COO',
  email: 'test@example.com',
  officePhone: '555-0100',
};

const origin = 'https://app.example.com';

const htmlStandard = renderSignature({
  profile,
  brand: mockSignatureBrand,
  template: mockSignatureTemplate('standard'),
  publicSiteOrigin: origin,
});

assert.match(
  htmlStandard,
  /height:auto/,
  'standard: generic static logo uses height:auto so aspect ratio is preserved'
);
assert.doesNotMatch(
  htmlStandard,
  /height="134"/,
  'standard: generic logo must not use legacy fixed aspect height'
);
assert.ok(
  htmlStandard.includes('white-space:nowrap') && htmlStandard.includes('Office:'),
  'standard: Office/Mobile label column uses nowrap so values stay beside labels'
);

const iconBase = `${origin}/email-assets/`;
assert.ok(
  htmlStandard.includes(`${iconBase}icon-linkedin.png?v=6`),
  'standard: LinkedIn icon resolves to publicSiteOrigin /email-assets/ with cache-bust query'
);
assert.ok(
  htmlStandard.includes(`${iconBase}icon-facebook.png?v=6`),
  'standard: Facebook icon resolves to publicSiteOrigin /email-assets/ with cache-bust query'
);
assert.ok(
  htmlStandard.includes(`${iconBase}icon-instagram.png?v=6`),
  'standard: Instagram icon resolves to publicSiteOrigin /email-assets/ with cache-bust query'
);
assert.ok(
  htmlStandard.includes(`${iconBase}icon-reddit.png?v=7`),
  'standard: Reddit icon resolves to publicSiteOrigin /email-assets/ with cache-bust query'
);

// Discord support: when a Discord URL is supplied, the icon row should include the
// Discord asset and the brand href.
const htmlDiscord = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    socialLinks: { ...mockSignatureBrand.socialLinks, discord: 'https://discord.gg/example' },
  },
  template: mockSignatureTemplate('standard'),
  publicSiteOrigin: origin,
});
assert.ok(
  htmlDiscord.includes(`${iconBase}icon-discord.png?v=6`),
  'standard: Discord icon resolves to publicSiteOrigin /email-assets/ with cache-bust query'
);
assert.match(
  htmlDiscord,
  /href="https:\/\/discord\.gg\/example[^"]*"/,
  'standard: Discord URL renders inside the social row'
);
// When no Discord URL is provided, the Discord <td> should not appear.
assert.doesNotMatch(
  htmlStandard,
  /icon-discord\.png/,
  'standard: Discord cell is omitted when no Discord URL is provided'
);
assert.doesNotMatch(htmlStandard, /\/api\/image-proxy/i, 'standard: no image proxy URLs in img src');
assert.doesNotMatch(htmlStandard, /src="http:\/\//i, 'standard: no non-HTTPS image URLs');
assert.ok(
  htmlStandard.includes('border-collapse:collapse;margin-top:10px'),
  'standard: social row uses nested table'
);
assert.ok(
  htmlStandard.includes('bgcolor="#e5e5e5"') && htmlStandard.includes('height="1"'),
  'standard: divider uses 1px td (Gmail-safe)'
);

const htmlExplicit = renderSignature({
  profile,
  brand: { ...mockSignatureBrand, logoHeightPx: 72 },
  template: mockSignatureTemplate('standard'),
  publicSiteOrigin: origin,
});
assert.match(htmlExplicit, /height="72"/, 'standard: explicit logoHeightPx in img attributes');

const htmlStacked = renderSignature({
  profile,
  brand: mockSignatureBrand,
  template: mockSignatureTemplate('stacked'),
  publicSiteOrigin: origin,
});
assert.match(htmlStacked, /height:auto/, 'stacked: generic static logo uses height:auto');
assert.match(
  htmlStacked,
  /max-width:665px/,
  'stacked: root table cap stays slightly above minimal/corporate layouts'
);

const htmlAnimatedLogo = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    logoHeightPx: undefined,
    animation: { enabled: true, gifUrl: 'https://example.com/images/sample.gif' },
  },
  template: mockSignatureTemplate('standard'),
  publicSiteOrigin: origin,
});
assert.match(
  htmlAnimatedLogo,
  /height:auto/,
  'standard: animated GIF logo without logoHeightPx still uses height:auto'
);

// Corporate template with List + Image content blocks
const corporateTemplate: import('../src/core/types').SignatureTemplate = {
  id: 'corporate-smoke',
  name: 'Corporate',
  layout: 'corporate',
  elements: [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
    { type: 'social' },
    { type: 'divider' },
    { type: 'address' },
    { type: 'contentBlocks' },
  ],
};

const htmlListImage = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    contentBlocks: [
      {
        type: 'list',
        enabled: true,
        listTitle: 'Recent Wins',
        listItems: [
          { title: 'Quarterly Report', description: 'Q4 published', url: 'https://example.com/q4' },
          { title: 'New Feature', url: 'https://example.com/feature' },
          { title: 'Plain Item' },
          { url: 'https://news.example.com/no-title' },
        ],
      },
      {
        type: 'image',
        enabled: true,
        imageUrl: 'https://example.com/images/promo.png',
        imageLinkUrl: 'https://example.com/promo',
      },
    ],
  },
  template: corporateTemplate,
  publicSiteOrigin: origin,
});

assert.ok(
  htmlListImage.includes('Recent Wins') && htmlListImage.includes('Quarterly Report'),
  'corporate/list: title and item title render'
);
assert.ok(
  htmlListImage.includes('Q4 published'),
  'corporate/list: item description renders'
);
assert.match(
  htmlListImage,
  /href="https:\/\/example\.com\/q4[^"]*"/,
  'corporate/list: item URL renders as link'
);
assert.ok(
  htmlListImage.includes('news.example.com'),
  'corporate/list: URL-only row uses hostname as link label'
);
assert.match(
  htmlListImage,
  /href="https:\/\/news\.example\.com\/no-title[^"]*"/,
  'corporate/list: URL-only row still links to full URL'
);
assert.ok(
  htmlListImage.includes('Plain Item'),
  'corporate/list: item without URL renders as plain span'
);
assert.match(
  htmlListImage,
  /src="https:\/\/example\.com\/images\/promo\.png[^"]*"[^>]*width="200"/,
  'corporate/image: image renders with 200px width'
);
assert.match(
  htmlListImage,
  /href="https:\/\/example\.com\/promo[^"]*"[\s\S]*?<img[^>]*promo\.png/,
  'corporate/image: image is wrapped in anchor when link is set'
);

assert.ok(
  htmlListImage.includes('max-device-width'),
  'corporate: responsive CSS includes max-device-width for narrow viewports'
);
assert.ok(
  htmlListImage.includes('sig-corp-blocks-stack') &&
    /class="sig-corp-blocks-stack[^"]*"[^>]*style="[^"]*padding-left:11px/.test(htmlListImage),
  'corporate: blocks column has comfortable padding beside vertical divider'
);
assert.match(
  htmlListImage,
  /class="sig-corp-blocks-stack[^"]*"[^>]*style="[^"]*width:54%[^"]*min-width:212px/,
  'corporate: side column widened on desktop for promotional blocks'
);
assert.ok(
  htmlListImage.includes('max-width:660px'),
  'corporate: root and mobile blocks table share 660px max width'
);
assert.ok(
  htmlListImage.includes('white-space:nowrap') && htmlListImage.includes('text-overflow:ellipsis'),
  'corporate: promotional block title rows prefer a single line with ellipsis overflow'
);
assert.ok(
  htmlListImage.includes('sig-blocks-stacked-row'),
  'corporate: stacked-style mobile blocks row is present'
);
assert.doesNotMatch(
  htmlListImage,
  /sig-blocks-mobile-sibling/,
  'corporate: no nested mobile sibling blocks table'
);
assert.match(
  htmlListImage,
  /@media only screen and \(min-width:601px\)[\s\S]*?tr\.sig-blocks-stacked-row[\s\S]*?display:\s*none\s*!important/,
  'corporate: wide viewport @media hides the mobile-only stacked blocks row'
);
assert.match(
  htmlListImage,
  /@media only screen and \(max-width:600px\)[\s\S]*?td\.sig-blocks-desktop[\s\S]*?display:\s*none\s*!important/,
  'corporate: narrow viewport @media hides the desktop side-column blocks copy'
);
assert.match(
  htmlListImage,
  /class="sig-corp-logo-stack"[^>]*style="[^"]*padding-right:28px/,
  'corporate: logo cell has wider padding-right before vertical accent'
);
assert.doesNotMatch(
  htmlListImage,
  /class="sig-root-layout-table"[^>]*style="[^"]*table-layout:fixed/,
  'corporate: outer root table no longer pins table-layout:fixed inline'
);
assert.doesNotMatch(
  htmlListImage,
  /class="sig-corp-header-layout-table"[^>]*style="[^"]*table-layout:fixed/,
  'corporate: inner header table no longer pins table-layout:fixed inline'
);
assert.match(
  htmlListImage,
  /td\.sig-content-block-cell\s*\{[\s\S]*?float:\s*none\s*!important[\s\S]*?clear:\s*both\s*!important/,
  'corporate: narrow viewport still stacks dual content-block cells inside the blocks column'
);
assert.match(
  htmlListImage,
  /only screen and \(max-width:768px\)/,
  'corporate: mobile @media includes the 768px breakpoint for tablets'
);
assert.match(
  htmlListImage,
  /table\.sig-(?:root-layout-table|corp-header-layout-table)[\s\S]*?table-layout:\s*auto\s*!important/,
  'corporate: mobile CSS switches layout tables to table-layout auto'
);
assert.ok(
  htmlListImage.includes('class="sig-root-layout-table"') &&
    htmlListImage.includes('class="sig-corp-header-layout-table"'),
  'corporate: root and header tables carry layout class names'
);
assert.doesNotMatch(
  htmlListImage,
  /td\.sig-corp-logo-stack\s*\{[\s\S]*?display:\s*block\s*!important/,
  'corporate: narrow viewport keeps header row table layout (logo not forced to block)'
);
assert.doesNotMatch(
  htmlListImage,
  /td\.sig-corp-main-stack\s*\{[\s\S]*?border-left:\s*none\s*!important/,
  'corporate: narrow viewport keeps accent border on main column'
);
assert.ok(
  htmlListImage.includes('class="sig-content-blocks-grid"') &&
    htmlListImage.includes('sig-content-block-cell'),
  'corporate: two enabled blocks render in a side-by-side grid inside the blocks column'
);
assert.match(
  htmlListImage,
  /td\.sig-content-block-cell\s*\{/,
  'corporate: responsive CSS stacks dual content-block cells on narrow viewports'
);
assert.ok(
  htmlListImage.includes('sig-content-block-cell-left') &&
    htmlListImage.includes('sig-content-block-cell-right'),
  'corporate: dual promo blocks use left/right cell classes'
);
assert.match(
  htmlListImage,
  /@media only screen and \(min-width:601px\)[\s\S]*?td\.sig-content-block-cell-right[\s\S]*?border-left:\s*1px solid #e5e5e5/,
  'corporate: desktop @media adds vertical separator between promo blocks'
);
assert.match(
  htmlListImage,
  /@media only screen and \(min-width:601px\)[\s\S]*?td\.sig-content-block-cell-left[\s\S]*?padding-right:\s*12px/,
  'corporate: desktop @media adds gutter before promo block divider'
);
assert.match(
  htmlListImage,
  /sig-blocks-stacked-row[\s\S]*?Recent Wins/,
  'corporate: promo blocks render in stacked mobile row'
);
assert.doesNotMatch(
  htmlListImage,
  /<tr class="sig-blocks-stacked-row"[\s\S]*?sig-content-blocks-grid/,
  'corporate: stacked row uses vertical promo markup without side-by-side grid'
);
assert.match(
  htmlListImage,
  /sig-blocks-stacked-row[\s\S]*?padding-top:12px/,
  'corporate: stacked row uses stacked-style spacing'
);
assert.match(
  htmlListImage,
  /bgcolor="#e5e5e5"[^>]*height:1px/,
  'corporate: divider uses solid grey rule (Gmail-safe)'
);
assert.match(
  htmlListImage,
  /@media only screen and \(max-width:600px\)[\s\S]*?td\.sig-content-block-cell-right[\s\S]*?border-top:\s*1px solid #e5e5e5/,
  'corporate: mobile @media adds separator between stacked promo blocks'
);
assert.match(
  htmlListImage,
  /sig-content-block-cell-right[^>]*border-top:1px solid #e5e5e5/,
  'corporate: dual promo right cell includes inline border for stacked mobile separator'
);

// Corporate template should not show redundant Phone/Email/Web labels — the values
// already look like phone numbers / emails / URLs. Mobile keeps its label so it can
// be distinguished from the main office number when both are set.
const htmlCorporateWithMobile = renderSignature({
  profile: { ...profile, mobilePhone: '555-0200' },
  brand: mockSignatureBrand,
  template: corporateTemplate,
  publicSiteOrigin: origin,
});
const corporateContactRowRe = /<table[^>]*font-size:13px;[^"]*"[\s\S]*?<\/table>/;
const contactBlock = htmlCorporateWithMobile.match(corporateContactRowRe)?.[0] ?? '';
assert.ok(contactBlock.length > 0, 'corporate: contact table is present in rendered output');
assert.doesNotMatch(contactBlock, /Phone</i, 'corporate: removes "Phone" label');
assert.doesNotMatch(contactBlock, />Email</i, 'corporate: removes "Email" label');
assert.doesNotMatch(contactBlock, />Web</i, 'corporate: removes "Web" label');
assert.match(contactBlock, /Mobile/i, 'corporate: keeps "Mobile" label to differentiate from main phone');

// Website should display without the https:// prefix in the body, but href stays fully qualified.
const htmlCorporateWebsite = renderSignature({
  profile,
  brand: { ...mockSignatureBrand, website: 'www.example.com' },
  template: corporateTemplate,
  publicSiteOrigin: origin,
});
assert.match(
  htmlCorporateWebsite,
  /href="https:\/\/www\.example\.com"[^>]*>\s*www\.example\.com\s*</,
  'corporate: website displays prefix-less but href keeps https://'
);
assert.doesNotMatch(
  htmlCorporateWebsite,
  />\s*https:\/\/www\.example\.com\s*</,
  'corporate: website body should not include https:// prefix'
);
assert.match(
  htmlListImage,
  /sig-corp-blocks-stack[\s\S]*Recent Wins/,
  'corporate: content blocks render in header side column on desktop'
);
assert.doesNotMatch(
  htmlListImage,
  /<td[^>]*width="220"[^>]*>\s*<table[^>]*>[\s\S]*?Recent Wins/,
  'corporate: blocks must not render in the old 220px right column'
);

// Professional layout — same structure as corporate, distinct card visuals
const professionalTemplate: import('../src/core/types').SignatureTemplate = {
  id: 'professional-smoke',
  name: 'Professional',
  layout: 'professional',
  elements: corporateTemplate.elements,
};

const htmlProfessional = renderSignature({
  profile,
  brand: mockSignatureBrand,
  template: professionalTemplate,
  publicSiteOrigin: origin,
});

const htmlProfessionalBlocks = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    contentBlocks: [
      {
        type: 'list',
        enabled: true,
        listTitle: 'Recent Wins',
        listItems: [{ title: 'Quarterly Report', url: 'https://example.com/q4' }],
      },
    ],
  },
  template: professionalTemplate,
  publicSiteOrigin: origin,
});

assert.ok(htmlProfessional.includes('sig-prof-card-shell'), 'professional: card shell wrapper');
assert.match(
  htmlProfessional,
  /sig-prof-card-shell[^>]*border:2px solid #2563eb/,
  'professional: card shell uses brand border'
);
assert.match(
  htmlProfessional,
  /table\.sig-prof-card-shell[\s\S]*box-sizing:\s*border-box\s*!important/,
  'professional: mobile @media includes card shell box-sizing for narrow viewports'
);
assert.match(
  htmlProfessional,
  /tr\.sig-prof-accent-row[\s\S]*display:\s*none\s*!important/,
  'professional: mobile @media hides inner accent bar (card shell border replaces it)'
);
assert.ok(
  htmlProfessional.includes('class="sig-prof-accent-row"'),
  'professional: accent bar row has sig-prof-accent-row class'
);
assert.match(
  htmlProfessional,
  /class="sig-corp-logo-stack"[^>]*style="[^"]*padding-right:14px/,
  'professional: tighter logo gutter than corporate'
);
assert.match(
  htmlProfessional,
  /bgcolor="#f0f4ff"[^>]*border-radius:10px[\s\S]*color:#2563eb/,
  'professional: hero grey panel with name in brand color'
);
const profGreyPanelCount = (htmlProfessional.match(/bgcolor="#f0f4ff"/g) ?? []).length;
assert.ok(
  profGreyPanelCount >= 3,
  `professional: multiple grey panels (logo, hero, contact/social); got ${profGreyPanelCount}`
);
assert.match(
  htmlProfessional,
  /bgcolor="#f3f4f6"[\s\S]*color:#2563eb[\s\S]*Acme Corp/,
  'professional: footer grey panel with brand-colored company name'
);
assert.ok(
  htmlProfessionalBlocks.includes('sig-blocks-stacked-row') &&
    htmlProfessionalBlocks.includes('sig-corp-header-layout-table'),
  'professional: shares corporate breakpoint structure'
);
assert.match(
  htmlProfessionalBlocks,
  /sig-corp-blocks-stack[\s\S]*Recent Wins/,
  'professional: content blocks in header side column on desktop'
);

// Minimal (standard layout) should render content blocks in the desktop side column.
const minimalTemplate: import('../src/core/types').SignatureTemplate = {
  id: 'minimal-smoke',
  name: 'Minimal',
  layout: 'standard',
  elements: [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
    { type: 'social' },
    { type: 'divider' },
    { type: 'address' },
    { type: 'contentBlocks' },
  ],
};

const htmlMinimalBlocks = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    contentBlocks: [
      {
        type: 'list',
        enabled: true,
        listTitle: 'Resources',
        listItems: [{ title: 'Docs', url: 'https://example.com/docs' }],
      },
    ],
  },
  template: minimalTemplate,
  publicSiteOrigin: origin,
});
assert.ok(
  htmlMinimalBlocks.includes('Resources') && htmlMinimalBlocks.includes('Docs'),
  'minimal: list block renders beside the signature body'
);
assert.match(
  htmlMinimalBlocks,
  /sig-blocks-stack[\s\S]*Resources/,
  'minimal: blocks live in the side column cell'
);
assert.match(
  htmlMinimalBlocks,
  /colspan="3"/,
  'minimal: divider/address span all columns when blocks column is present'
);
assert.doesNotMatch(
  htmlMinimalBlocks,
  /<tr>\s*<td colspan="2"[^>]*>\s*<table[^>]*>[\s\S]*?Resources/,
  'minimal: blocks must not sit in a dedicated bottom colspan="2" row'
);
assert.ok(
  htmlMinimalBlocks.includes('max-device-width'),
  'minimal: standard layout includes max-device-width stack rules'
);
assert.ok(
  htmlMinimalBlocks.includes('sig-blocks-stack') &&
    /class="sig-blocks-stack[^"]*"[^>]*style="[^"]*padding-left:11px/.test(htmlMinimalBlocks),
  'minimal: blocks column has comfortable padding beside vertical divider'
);
assert.match(
  htmlMinimalBlocks,
  /class="sig-blocks-stack[^"]*"[^>]*style="[^"]*width:56%[^"]*min-width:218px/,
  'minimal: side column widened on desktop for promotional blocks'
);
assert.ok(
  htmlMinimalBlocks.includes('white-space:nowrap') && htmlMinimalBlocks.includes('text-overflow:ellipsis'),
  'minimal: promotional block title rows prefer a single line with ellipsis overflow'
);
assert.ok(
  htmlMinimalBlocks.includes('max-width:660px'),
  'minimal: root and mobile blocks table share 660px max width'
);
assert.ok(
  htmlMinimalBlocks.includes('sig-blocks-stacked-row'),
  'minimal: stacked-style mobile blocks row is present'
);
assert.doesNotMatch(
  htmlMinimalBlocks,
  /sig-blocks-mobile-sibling/,
  'minimal: no nested mobile sibling blocks table'
);
assert.match(
  htmlMinimalBlocks,
  /@media only screen and \(min-width:601px\)[\s\S]*?tr\.sig-blocks-stacked-row[\s\S]*?display:\s*none\s*!important/,
  'minimal: wide viewport @media hides the mobile-only stacked blocks row'
);
assert.match(
  htmlMinimalBlocks,
  /sig-blocks-stacked-row[\s\S]*?Resources/,
  'minimal: promo blocks render in stacked mobile row'
);
assert.doesNotMatch(
  htmlMinimalBlocks,
  /<tr class="sig-blocks-stacked-row"[\s\S]*?sig-content-blocks-grid/,
  'minimal: stacked row uses vertical promo markup without side-by-side grid'
);
assert.match(
  htmlMinimalBlocks,
  /123 Main St[\s\S]*?sig-blocks-stacked-row[\s\S]*?Resources/,
  'minimal: stacked row appears after address'
);
assert.match(
  htmlMinimalBlocks,
  /@media only screen and \(max-width:600px\)[\s\S]*?td\.sig-blocks-desktop[\s\S]*?display:\s*none\s*!important/,
  'minimal: narrow viewport @media hides the desktop side-column blocks copy'
);
assert.match(
  htmlMinimalBlocks,
  /class="sig-logo-stack"[^>]*style="[^"]*padding-right:24px/,
  'minimal: logo cell has wider padding-right before vertical accent'
);
assert.doesNotMatch(
  htmlMinimalBlocks,
  /class="sig-root-layout-table"[^>]*style="[^"]*table-layout:fixed/,
  'minimal: outer root table no longer pins table-layout:fixed inline'
);
assert.match(
  htmlMinimalBlocks,
  /td\.sig-content-block-cell\s*\{[\s\S]*?float:\s*none\s*!important[\s\S]*?clear:\s*both\s*!important/,
  'minimal: narrow viewport still stacks dual content-block cells inside the blocks column'
);
assert.match(
  htmlMinimalBlocks,
  /only screen and \(max-width:768px\)/,
  'minimal: mobile @media includes the 768px breakpoint for tablets'
);
assert.ok(
  htmlMinimalBlocks.includes('class="sig-root-layout-table"'),
  'minimal: root layout table has class for fluid mobile layout'
);
assert.match(
  htmlMinimalBlocks,
  /table\.sig-root-layout-table\s*\{[\s\S]*?table-layout:\s*auto\s*!important/,
  'minimal: mobile CSS switches root table to table-layout auto'
);
assert.doesNotMatch(
  htmlMinimalBlocks,
  /td\.sig-logo-stack\s*\{[\s\S]*?display:\s*block\s*!important/,
  'minimal: narrow viewport keeps header row table layout (logo not forced to block)'
);
assert.doesNotMatch(
  htmlMinimalBlocks,
  /td\.sig-main-stack\s*\{[\s\S]*?border-left:\s*none\s*!important/,
  'minimal: narrow viewport keeps accent border on main column'
);
assert.match(
  htmlMinimalBlocks,
  /td\.sig-content-block-cell\s*\{/,
  'minimal: responsive CSS stacks dual content-block cells on narrow viewports'
);

const htmlMinimalTwoBlocks = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    contentBlocks: [
      {
        type: 'list',
        enabled: true,
        listTitle: 'Column A',
        listItems: [{ title: 'First', url: 'https://example.com/a' }],
      },
      {
        type: 'list',
        enabled: true,
        listTitle: 'Column B',
        listItems: [{ title: 'Second', url: 'https://example.com/b' }],
      },
    ],
  },
  template: minimalTemplate,
  publicSiteOrigin: origin,
});
assert.ok(
  htmlMinimalTwoBlocks.includes('class="sig-content-blocks-grid"') &&
    htmlMinimalTwoBlocks.includes('sig-content-block-cell'),
  'minimal: two enabled blocks render in a side-by-side grid inside the blocks column'
);
assert.ok(
  htmlMinimalTwoBlocks.includes('sig-content-block-cell-left') &&
    htmlMinimalTwoBlocks.includes('sig-content-block-cell-right'),
  'minimal: dual promo blocks use left/right cell classes'
);
assert.match(
  htmlMinimalTwoBlocks,
  /@media only screen and \(min-width:601px\)[\s\S]*?td\.sig-content-block-cell-right[\s\S]*?border-left:\s*1px solid #e5e5e5/,
  'minimal: desktop @media adds vertical separator between promo blocks'
);
assert.match(
  htmlMinimalTwoBlocks,
  /@media only screen and \(min-width:601px\)[\s\S]*?td\.sig-content-block-cell-left[\s\S]*?padding-right:\s*12px/,
  'minimal: desktop @media adds gutter before promo block divider'
);
assert.ok(
  htmlMinimalTwoBlocks.includes('sig-blocks-stacked-row'),
  'minimal: two-block fixture includes stacked mobile row'
);
assert.match(
  htmlMinimalTwoBlocks,
  /sig-content-block-cell-right[^>]*border-top:1px solid #e5e5e5/,
  'minimal: dual promo right cell includes inline border for stacked mobile separator'
);
assert.match(
  htmlMinimalTwoBlocks,
  /@media only screen and \(max-width:600px\)[\s\S]*?td\.sig-content-block-cell-right[\s\S]*?border-top:\s*1px solid #e5e5e5/,
  'minimal: mobile @media adds separator between stacked promo blocks'
);

// Stacked template should also support blocks.
const stackedTemplate: import('../src/core/types').SignatureTemplate = {
  id: 'stacked-smoke',
  name: 'Stacked',
  layout: 'stacked',
  elements: [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
    { type: 'social' },
    { type: 'divider' },
    { type: 'contentBlocks' },
  ],
};
const htmlStackedBlocks = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    contentBlocks: [
      {
        type: 'image',
        enabled: true,
        imageUrl: 'https://example.com/images/stacked.png',
      },
    ],
  },
  template: stackedTemplate,
  publicSiteOrigin: origin,
});
assert.match(
  htmlStackedBlocks,
  /src="https:\/\/example\.com\/images\/stacked\.png[^"]*"/,
  'stacked: image block renders inside the new bottom row'
);

const htmlStackedTwoBlocks = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    contentBlocks: [
      {
        type: 'list',
        enabled: true,
        listTitle: 'Resources',
        listItems: [{ title: 'Guide', url: 'https://example.com/guide' }],
      },
      {
        type: 'image',
        enabled: true,
        imageUrl: 'https://example.com/images/stacked-two.png',
      },
    ],
  },
  template: stackedTemplate,
  publicSiteOrigin: origin,
});
assert.ok(
  !htmlStackedTwoBlocks.includes('sig-content-blocks-grid'),
  'stacked: two promo blocks render vertically without desktop grid'
);
assert.ok(
  !htmlStackedTwoBlocks.includes('sig-content-block-cell-right'),
  'stacked: no border-top line above second promo block title'
);

// Default layout regression
const htmlDefault = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    contentBlocks: [
      {
        type: 'list',
        enabled: true,
        listTitle: 'Offers',
        listItems: [{ title: 'Promo', url: 'https://example.com/promo' }],
      },
    ],
  },
  template: mockSignatureTemplate('default'),
  publicSiteOrigin: origin,
});
assert.ok(
  htmlDefault.includes('border-right: 2px solid') && htmlDefault.includes('font-weight: 600; color: #111111;">P:&nbsp;</'),
  'default: accent border and P|E|W contact row'
);

// Creator layout
const htmlCreator = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    primaryColor: '#ff4655',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/company/example',
      reddit: 'https://www.reddit.com/user/example',
      discord: 'https://discord.gg/example',
    },
    contentBlocks: [
      {
        type: 'list',
        enabled: true,
        listItems: [
          { title: 'Nucleas', url: 'https://example.com/nucleas' },
          { title: 'Tailnote', url: 'https://example.com/tailnote' },
        ],
      },
    ],
  },
  template: mockSignatureTemplate('creator'),
  publicSiteOrigin: origin,
});
assert.ok(htmlCreator.includes('background-color: #1e1f22'), 'creator: dark card background');
assert.ok(htmlCreator.includes('border-collapse: collapse'), 'creator: nested tables');
assert.ok(htmlCreator.includes(`${iconBase}icon-linkedin.png?v=6`), 'creator: hosted LinkedIn icon');
assert.doesNotMatch(htmlCreator, /flaticon\.com/i, 'creator: no external flaticon CDN');
assert.doesNotMatch(htmlCreator, /src="http:\/\//i, 'creator: no non-HTTPS images');
assert.ok(htmlCreator.includes('mailto:test@example.com'), 'creator: mailto link');
assert.ok(htmlCreator.includes('tel:'), 'creator: tel link');
assert.ok(htmlCreator.includes('background-color: #2b2d31'), 'creator: promo pill styling');
assert.ok(htmlCreator.includes('Nucleas'), 'creator: promo pill label');
assert.ok(htmlCreator.includes('color: #b5bac1'), 'creator: tagline uses readable light text on dark card');
assert.doesNotMatch(
  htmlCreator,
  /font-size: 13px; color: #0a0a0a|font-size: 13px; color: {{primaryColor}}/,
  'creator: tagline does not use dark primary color on dark background'
);

// Executive Minimalist layout
const htmlExecutive = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    primaryColor: '#901a1e',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/company/example',
      reddit: 'https://www.reddit.com/user/example',
    },
    contentBlocks: [
      {
        type: 'list',
        enabled: true,
        listTitle: 'Featured work',
        listItems: [
          { title: 'Nucleas', url: 'https://example.com/nucleas' },
          { title: 'Tailnote', url: 'https://example.com/tailnote' },
        ],
      },
    ],
  },
  template: mockSignatureTemplate('executive_minimalist'),
  publicSiteOrigin: origin,
});
assert.ok(htmlExecutive.includes('Times New Roman'), 'executive: serif name styling');
assert.ok(htmlExecutive.includes('border-bottom: 1px solid #dddddd'), 'executive: header divider');
assert.ok(htmlExecutive.includes('>Connect:</'), 'executive: connect row label');
assert.match(htmlExecutive, /<a href="https:\/\/www\.linkedin\.com[^"]*"[^>]*>LinkedIn<\/a>/, 'executive: text LinkedIn link');
assert.doesNotMatch(htmlExecutive, /icon-linkedin\.png/, 'executive: no social icon images');
assert.ok(htmlExecutive.includes('>Featured work:</'), 'executive: promo row uses listTitle from content block');
assert.doesNotMatch(htmlExecutive, />Portfolio:</, 'executive: no hardcoded Portfolio label');
assert.ok(htmlExecutive.includes('Nucleas') && htmlExecutive.includes('|'), 'executive: portfolio pipe separators');
assert.ok(htmlExecutive.includes('#901a1e'), 'executive: primary color on portfolio links');

// Legacy custom block still renders for back-compat reads — but without "Learn more".
const htmlLegacyCustom = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    contentBlocks: [
      {
        type: 'custom',
        enabled: true,
        customTitle: 'Legacy',
        customText: 'Old data still works',
        customUrl: 'https://example.com/legacy',
      },
    ],
  },
  template: corporateTemplate,
  publicSiteOrigin: origin,
});
assert.ok(
  htmlLegacyCustom.includes('Legacy') && htmlLegacyCustom.includes('Old data still works'),
  'corporate/custom: legacy custom block still renders'
);
assert.doesNotMatch(
  htmlLegacyCustom,
  /Learn more/i,
  'corporate/custom: legacy custom block no longer emits a "Learn more" row'
);
assert.match(
  htmlLegacyCustom,
  /<a href="https:\/\/example\.com\/legacy[^"]*"[^>]*>Legacy<\/a>/,
  'corporate/custom: title itself is the link when URL is set and no image'
);

process.stdout.write('email-client-smoke: all checks passed.\n');
