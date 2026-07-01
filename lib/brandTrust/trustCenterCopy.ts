export type TrustCenterPillarId = 'deliverability' | 'security' | 'branding';

export type TrustCenterLearnSection = { title: string; body: string };

export const TRUST_CENTER_PRE_SCAN = {
  headline: "See how your domain is doing — and fix what's holding it back.",
  intro:
    "We'll walk you through three things that affect whether people trust email from your domain.",
  scanLead: (domain: string) => `Enter ${domain} below to see what's working and what to fix.`,
  scanLeadGeneric: "Enter your domain below to see what's working and what to fix.",
  trustLine: 'Free scan · No DNS changes required to start',
} as const;

export type TrustCenterScanCheck = {
  label: string;
  solution: string;
};

export type TrustCenterScanExplainerPillar = {
  id: TrustCenterPillarId;
  title: string;
  promise: string;
  checks: TrustCenterScanCheck[];
};

export const TRUST_CENTER_SCAN_EXPLAINER: TrustCenterScanExplainerPillar[] = [
  {
    id: 'deliverability',
    title: 'Inbox delivery',
    promise: 'Will your mail land in the inbox, not spam?',
    checks: [
      {
        label: 'Sender policy (SPF)',
        solution:
          'We read your current DNS record and give you the exact TXT value to copy and paste.',
      },
      {
        label: 'Mail routing (MX)',
        solution:
          'We flag missing or misconfigured mail routing and explain what to set at your DNS provider.',
      },
      {
        label: 'Encrypted delivery (TLS)',
        solution:
          'We check whether your mail servers accept encrypted delivery and tell you what to fix.',
      },
      {
        label: 'Secure website (HTTPS)',
        solution:
          'We confirm your site loads over HTTPS and note certificate or redirect issues.',
      },
    ],
  },
  {
    id: 'security',
    title: 'Anti-spoofing',
    promise: 'Can receivers spot fake email from your domain?',
    checks: [
      {
        label: 'Message signing (DKIM)',
        solution:
          'We show whether signing is set up and walk you through enabling it with your email provider.',
      },
      {
        label: 'Impersonation policy (DMARC)',
        solution:
          'We generate the policy record you need and help you tighten it over time.',
      },
    ],
  },
  {
    id: 'branding',
    title: 'Inbox logo',
    promise: 'Can your logo show beside messages in Gmail and others?',
    checks: [
      {
        label: 'Logo DNS record (BIMI)',
        solution:
          'After you upload your logo, we give you the DNS record to publish at your provider.',
      },
      {
        label: 'Hosted logo file',
        solution: 'Upload your logo on Tailnote — we convert it to the format inboxes expect.',
      },
      {
        label: 'Certificate readiness (optional)',
        solution:
          'We explain when a certificate is optional and when Gmail may require one.',
      },
    ],
  },
];

export const TRUST_CENTER_SCAN_EXPLAINER_COMPACT =
  'We check inbox delivery, anti-spoofing, and inbox logo setup — then show you exactly what to fix.';

export const TRUST_CENTER_NO_DOMAIN = {
  title: 'Brand Trust Center',
  beforeLink: 'Add your company website on the ',
  signatureLinkLabel: 'Signature',
  afterLink: ' tab so we know which domain to check. You can also scan any domain below.',
} as const;

export const TRUST_CENTER_SUMMARY = {
  allGood:
    "You're in great shape. Deliverability, security, and branding all look good for this domain.",
  partial: (n: number) =>
    `Most of this looks good. We found ${n} thing${n === 1 ? '' : 's'} worth fixing — we'll walk you through each one below.`,
} as const;

export const TRUST_CENTER_PILLAR_COPY = {
  deliverability: {
    headline: 'Will your emails land in the inbox instead of spam?',
    confirmed: 'Your emails are set up to land in the inbox, not spam.',
    actionLabel: 'Show me how to fix this',
    fixIntro: 'Add this record in your DNS provider (where you manage your domain settings).',
    defaultFix:
      'update your sender policy so inbox providers know which servers are allowed to send email as you.',
    passingLabels: {
      mx: 'mail routing',
      tls: 'encrypted mail delivery',
      https: 'your secure website',
    },
  },
  security: {
    headline: "Can people tell a fake email isn't really from you?",
    confirmed: "Scammers can't easily send fake emails that look like they're from you.",
    actionLabel: 'Show me how to fix this',
    defaultFix: 'finish setting up message signing and your impersonation policy.',
    working: {
      dkim: 'message signing is already set up',
      dmarc: 'your impersonation policy is in place',
    },
  },
  branding: {
    headline: 'Want your logo to show up next to your emails in Gmail and other inboxes?',
    confirmed: 'Your logo is set up to show in supporting inboxes.',
    confirmedProviderNote:
      'Yahoo and Fastmail are more likely to show your logo with your current setup.',
    actionLabel: 'Set it up free',
    showDnsLabel: 'Show DNS record',
    signupLabel: 'Create free account',
    fixIntro: 'Add this record in your DNS provider (where you manage your domain settings).',
    notSignedIn:
      'Create a free Tailnote account to upload your logo, copy the DNS record we generate, add it at your provider, and rescan.',
    notUploaded:
      "Nothing is set up yet. Here's what to do for free:\n1. Upload your logo\n2. Copy the DNS record we give you\n3. Add it at your DNS provider and rescan",
    uploadedPending:
      'Your logo is ready on our side. Copy the DNS record below, add it at your DNS provider, then rescan to confirm.',
  },
} as const;

export const TRUST_CENTER_CERTIFICATE_PREAMBLE =
  'A free setup can work in some inboxes (like Yahoo or Fastmail). Gmail often requires a paid certificate before showing your logo — that step is optional and only needed if Gmail is a priority.';

export const TRUST_CENTER_LEARN: Record<TrustCenterPillarId, TrustCenterLearnSection[]> = {
  deliverability: [
    {
      title: 'Sender policy (SPF)',
      body: 'SPF is a guest list of which servers are allowed to send email as your domain. When it is missing or wrong, providers are more likely to treat your mail as suspicious or send it to spam.',
    },
    {
      title: 'Mail routing',
      body: 'MX records tell the internet where to deliver email sent to addresses at your domain (like you@company.com). Without them, people cannot reach your inbox.',
    },
    {
      title: 'Encrypted delivery',
      body: 'Encrypted mail delivery (TLS) helps messages travel securely between mail servers. Most major providers expect this for trustworthy delivery.',
    },
    {
      title: 'Secure website',
      body: 'A working HTTPS website supports overall trust in your domain. Some branding features also depend on your site loading securely.',
    },
  ],
  security: [
    {
      title: 'Message signing (DKIM)',
      body: 'DKIM adds a digital signature to outgoing mail so receivers can verify the message was not changed in transit and truly came from your domain.',
    },
    {
      title: 'Impersonation policy (DMARC)',
      body: 'DMARC tells providers what to do when someone sends fake email pretending to be you — for example, send it to spam or block it. It is one of the strongest protections against domain spoofing.',
    },
  ],
  branding: [
    {
      title: 'Inbox logos',
      body: 'Some email apps can show your brand logo beside messages in the inbox — separate from the logo inside your email signature. This is a branding feature, not a requirement for mail to be delivered.',
    },
    {
      title: 'Why DNS matters',
      body: 'You publish a small DNS record that points to your hosted logo file. Once that record is live, supporting inboxes can look up and display your logo.',
    },
    {
      title: 'Certificates (optional)',
      body: 'Some providers — especially Gmail — want extra proof that your logo is really yours. Paid certificates (CMC or VMC) are optional and only needed if you care about logo display in those specific inboxes.',
    },
  ],
};

/** Join a list for readable English: "a, b, and c". */
export function joinNaturalList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

export function deliverabilityPartialBody(passing: string[], fixPhrase: string): string {
  if (passing.length === 0) {
    return `The main step left is to ${fixPhrase}`;
  }
  return `Good news: ${joinNaturalList(passing)} already look${passing.length === 1 ? 's' : ''} fine. The remaining step is to ${fixPhrase}`;
}

export function securityPartialBody(working: string[], fixPhrase: string): string {
  if (working.length === 0) {
    return `Next, ${fixPhrase}`;
  }
  return `Good news: ${joinNaturalList(working)}. Next, ${fixPhrase}`;
}

export function brandingPartialBody(
  kind: 'dns_missing' | 'dns_mismatch' | 'svg' | 'generic',
  fixPhrase: string,
): string {
  switch (kind) {
    case 'dns_mismatch':
      return `Your logo is hosted on Tailnote, but your inbox-logo DNS record still points to a different file. The next step is to ${fixPhrase}.`;
    case 'svg':
      return `Your hosted logo file needs a small adjustment before inboxes can display it. Re-upload on Tailnote if needed, then ${fixPhrase}.`;
    case 'dns_missing':
      return `Your logo is ready on our side. The next step is to ${fixPhrase}.`;
    default:
      return `The next step is to ${fixPhrase}.`;
  }
}
