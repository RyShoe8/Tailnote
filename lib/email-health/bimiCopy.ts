/** Plain-English BIMI education and implementation copy for non-technical users. */

export const BIMI_WHAT_IS = {
  title: 'What is BIMI?',
  body: 'BIMI (Brand Indicators for Message Identification) helps supporting inboxes display your brand logo next to your emails. It is a trust and branding feature — not a guarantee that every inbox will show your logo.',
};

export const BIMI_CMC_VMC = {
  title: 'What are CMC and VMC?',
  intro:
    'Both certificates help inboxes trust your brand logo. The main difference is how your logo is verified: VMC requires a registered trademark; CMC requires your logo to have been in public use for at least 12 months.',
  body: 'Both are certificate-based ways to strengthen logo verification. A VMC (Verified Mark Certificate) is typically required for Gmail logo display and the blue verified checkmark. A CMC (Common Mark Certificate) is a faster path when you do not have a registered trademark. Tailnote can detect certificate links but cannot always prove the exact type without manual review.',
};

export const BIMI_CERTIFICATE_OPTIONS = {
  title: 'Choose a certificate',
  intro: BIMI_CMC_VMC.intro,
  pricingDisclaimer:
    'Approximate Sectigo retail pricing — verify current rates on Sectigo. Tailnote does not sell VMC or CMC certificates.',
  vmc: {
    shortName: 'VMC',
    name: 'Verified Mark Certificate',
    requirement: 'Registered trademark required (e.g. USPTO or another recognized office).',
    gmailCheckmark: true,
    issuanceNote: 'Full BIMI compliance; includes Gmail’s blue verified checkmark.',
    priceLabel: 'From ~$1,350/year',
    purchaseUrl: 'https://www.sectigo.com/ssl-certificates-tls/verified-mark-certificates',
    purchaseLabel: 'Get a VMC from Sectigo',
  },
  cmc: {
    shortName: 'CMC',
    name: 'Common Mark Certificate',
    requirement: 'No trademark — logo must be in public use for 12+ months.',
    gmailCheckmark: false,
    issuanceNote: 'Often issued in 5–10 business days; basic BIMI compliance.',
    priceLabel: 'From ~$990/year',
    purchaseUrl: 'https://www.sectigo.com/ssl-certificates-tls/common-mark-certificates',
    purchaseLabel: 'Get a CMC from Sectigo',
  },
} as const;

export const BIMI_INBOX_PREVIEW = {
  caption: 'How your logo may appear in supporting inboxes (e.g. Gmail, Yahoo)',
  senderName: 'Your Company',
  subject: 'Your latest update',
  preview: 'Thanks for being a customer — here is what is new…',
};

export const BIMI_REALITY_CHECK = {
  title: 'What to expect',
  body: 'Logo display is not guaranteed everywhere. Support varies by inbox provider (Gmail, Yahoo, Fastmail, and others). BIMI works best when SPF, DKIM, and DMARC are already in good shape.',
};

export const BIMI_IMPLEMENTATION_STEPS = [
  'Make sure SPF and DKIM pass for every service that sends email as your domain.',
  'Set DMARC to quarantine or reject (not monitoring-only).',
  'Prepare a square, BIMI-compatible SVG logo hosted over HTTPS.',
  'Publish a BIMI DNS record at default._bimi with your logo URL.',
  'Add certificate support (CMC or VMC) if your target inboxes require it.',
  'Test, monitor, and rescan after each DNS change.',
];

export const SIGNATURE_VS_INBOX_LOGO =
  'Your email signature logo and your inbox brand logo are separate things. BIMI helps supporting inboxes show your brand logo next to your emails — it does not change the logo inside your Tailnote signature.';

export const PAID_BIMI_HOSTING_CTA =
  'On a paid Tailnote plan, we can convert and host a BIMI-ready logo for you — then give you the DNS record to copy.';

export const BIMI_PLACEHOLDER_SVG_NOTE =
  'placeholder.svg is an example only — inbox providers require a valid, square BIMI SVG hosted over HTTPS.';

export const BIMI_PROVIDER_MATRIX = {
  title: 'Which inboxes support your setup?',
  intro:
    'A BIMI DNS record and hosted logo are the baseline. Many major inboxes also require a certificate (CMC or VMC) before showing your logo.',
  footnote:
    'Logo display is not guaranteed. Support varies by inbox provider and may change. This table reflects current major-provider BIMI guidance.',
  columns: {
    dnsOnly: 'BIMI DNS + hosted SVG',
    cmc: 'CMC certificate',
    vmc: 'VMC certificate',
  },
  providers: [
    {
      name: 'Gmail',
      dnsOnly: 'Unlikely — a certificate is usually required',
      cmc: 'Logo may appear; no blue verified checkmark',
      vmc: 'Logo + blue verified checkmark',
    },
    {
      name: 'Yahoo',
      dnsOnly: 'May work when DMARC is enforced',
      cmc: 'Supported',
      vmc: 'Supported',
    },
    {
      name: 'Fastmail',
      dnsOnly: 'May work when DMARC is enforced',
      cmc: 'Supported',
      vmc: 'Supported',
    },
  ],
} as const;

export const RASTER_SVG_HONESTY =
  'Logos uploaded as PNG or JPEG are converted into a compact SVG. Vector artwork works best, and some strict validators may still prefer a professionally prepared BIMI SVG.';
