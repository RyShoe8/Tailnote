import type { MailProvider } from '@/lib/email-health/scanners/mx';

export type DkimSetupGuide = {
  providerLabel: string;
  steps: string[];
  recordNote?: string;
};

const GENERIC_STEPS = [
  'Sign in to the admin console for whoever hosts your email (your IT team or email provider).',
  'Find message signing or DKIM settings — often under email security or authentication.',
  'Generate a new signing key if none exists.',
  'Copy the DNS record your provider shows (host name and value).',
  'Add that record at your DNS provider, wait for it to propagate (up to 48 hours), then rescan.',
];

const GUIDES: Record<MailProvider, DkimSetupGuide> = {
  'Google Workspace': {
    providerLabel: 'Google Workspace',
    steps: [
      'Sign in to admin.google.com as a super admin.',
      'Go to Apps → Google Workspace → Gmail → Authenticate email.',
      'Select your domain and click Generate new record.',
      'Copy the TXT record for google._domainkey (host and long value).',
      'In your DNS provider, add a TXT record at google._domainkey with that exact value.',
      'Back in Google Admin, click Start authentication and wait until status shows Authenticating email.',
      'Rescan your domain here once Google confirms the record is live.',
    ],
    recordNote: 'Google gives you one TXT record at google._domainkey.',
  },
  'Microsoft 365': {
    providerLabel: 'Microsoft 365',
    steps: [
      'Sign in to the Microsoft Defender portal (security.microsoft.com) or Microsoft 365 admin center.',
      'Open Email & collaboration → Policies & rules → Threat policies → Email authentication settings → DKIM.',
      'Select your domain and click Create DKIM keys or Enable if keys already exist.',
      'Copy both CNAME records Microsoft shows (selector1._domainkey and selector2._domainkey).',
      'In your DNS provider, add each CNAME exactly as Microsoft lists them.',
      'Return to the DKIM page and wait until Signing shows as Enabled (can take up to a few days).',
      'Rescan your domain here once Microsoft reports signing is active.',
    ],
    recordNote: 'Microsoft 365 uses two CNAME records, not a single TXT paste value.',
  },
  'Zoho Mail': {
    providerLabel: 'Zoho Mail',
    steps: [
      'Sign in to Zoho Mail admin (mail.zoho.com or your Zoho admin console).',
      'Go to Email authentication or DKIM settings for your domain.',
      'Click Add selector or Generate DKIM key.',
      'Copy the TXT record Zoho shows (host and value).',
      'Add the TXT record in your DNS provider at the host Zoho specifies.',
      'In Zoho, verify the record and wait for DNS to propagate, then rescan.',
    ],
  },
  Fastmail: {
    providerLabel: 'Fastmail',
    steps: [
      'Sign in to Fastmail Settings → Domains and select your domain.',
      'Open Advanced → Email authentication (DKIM).',
      'Click Enable DKIM or Generate key if prompted.',
      'Copy the TXT record Fastmail provides.',
      'Add the TXT record in your DNS provider at the host Fastmail shows.',
      'Wait for Fastmail to confirm the record is valid, then rescan.',
    ],
  },
  'Proton Mail': {
    providerLabel: 'Proton Mail',
    steps: [
      'Sign in to Proton Mail and open Settings → All settings → Organization → Domain names.',
      'Select your domain and open the DKIM / email authentication section.',
      'Generate or view your DKIM signing key.',
      'Copy the TXT record Proton provides (host and value).',
      'Add the TXT record in your DNS provider.',
      'Wait for Proton to verify the record, then rescan.',
    ],
  },
  'Custom / other': {
    providerLabel: 'your email provider',
    steps: GENERIC_STEPS,
  },
};

function normalizeProvider(mailProvider?: string): MailProvider | undefined {
  if (!mailProvider) return undefined;
  const known = Object.keys(GUIDES) as MailProvider[];
  if (known.includes(mailProvider as MailProvider)) {
    return mailProvider as MailProvider;
  }
  return undefined;
}

export function getDkimSetupGuide(mailProvider?: string): DkimSetupGuide {
  const provider = normalizeProvider(mailProvider);
  if (provider && provider !== 'Custom / other') {
    return GUIDES[provider];
  }
  if (provider === 'Custom / other') {
    return {
      providerLabel: 'your email host',
      steps: GENERIC_STEPS,
      recordNote: 'Your provider’s admin console will show the exact host and value to add.',
    };
  }
  return {
    providerLabel: 'your email provider',
    steps: GENERIC_STEPS,
    recordNote: 'Your provider generates the exact DNS record — follow their admin console instructions.',
  };
}

export function dkimProviderCallout(mailProvider?: string): string | undefined {
  const provider = normalizeProvider(mailProvider);
  if (!provider || provider === 'Custom / other') return undefined;
  return `We detected ${provider} as your likely email host.`;
}

export const MISSING_DKIM_TITLE = 'DKIM signing does not appear to be set up';

export function isMissingDkimIssue(issue: { category: string; severity: string; title: string }): boolean {
  return (
    issue.category === 'dkim' &&
    issue.severity === 'fail' &&
    issue.title === MISSING_DKIM_TITLE
  );
}
