import {
  CATEGORY_WEIGHTS,
  type DomainIssue,
  type EmailHealthCategory,
  type StatusLabel,
} from '@/lib/email-health/types';

export type CategoryGuideEntry = {
  label: string;
  maxPoints: number;
  whatItChecks: string;
  whyItMatters: string;
  howPointsWork: string;
  defaultStepsToPass: string[];
};

export const CATEGORY_GUIDE: Record<EmailHealthCategory, CategoryGuideEntry> = {
  spf: {
    label: 'SPF',
    maxPoints: CATEGORY_WEIGHTS.spf,
    whatItChecks:
      'Whether your domain publishes a single SPF TXT record listing which services may send email as you.',
    whyItMatters:
      'SPF helps inbox providers reject messages from servers that are not authorized to use your domain.',
    howPointsWork: 'Pass = full points. Warn = partial (soft policy or lookup risk). Fail = no points (missing or broken SPF).',
    defaultStepsToPass: [
      'List every service that sends mail for your domain (Google, Microsoft, CRM, newsletters).',
      'Publish one SPF TXT record at your domain root with include: entries for each sender.',
      'End the record with ~all or -all after all includes.',
      'Wait for DNS to propagate (up to 48 hours), then rescan.',
    ],
  },
  dkim: {
    label: 'DKIM',
    maxPoints: CATEGORY_WEIGHTS.dkim,
    whatItChecks:
      'Whether DKIM public keys are published so receivers can verify message signatures.',
    whyItMatters:
      'DKIM proves messages were not altered in transit and strengthens alignment with DMARC.',
    howPointsWork: 'Pass = full points. Warn = partial (short or legacy key). Fail = no points (no DKIM found).',
    defaultStepsToPass: [
      'Open your email provider admin (Google Admin, Microsoft 365, etc.).',
      'Enable DKIM signing and copy the TXT record they provide.',
      'Add the TXT record at the host they specify (e.g. selector1._domainkey).',
      'Wait for DNS propagation, then rescan.',
    ],
  },
  dmarc: {
    label: 'DMARC',
    maxPoints: CATEGORY_WEIGHTS.dmarc,
    whatItChecks:
      'Whether a DMARC policy exists at _dmarc.yourdomain and how strictly failing mail is handled.',
    whyItMatters:
      'DMARC is the main control against domain impersonation and phishing using your brand.',
    howPointsWork:
      'Pass = full points (enforced policy with reporting). Warn = partial (monitor-only or gaps). Fail = no points.',
    defaultStepsToPass: [
      'Add a DMARC TXT record at _dmarc with at least p=none and rua= for reports.',
      'Review aggregate reports for 2–4 weeks to confirm legitimate mail passes SPF/DKIM.',
      'Tighten to p=quarantine, then p=reject with pct=100 when confident.',
      'Rescan after each DNS change.',
    ],
  },
  bimi: {
    label: 'BIMI',
    maxPoints: CATEGORY_WEIGHTS.bimi,
    whatItChecks:
      'Whether a BIMI record and logo URL exist for inbox brand display (optional for deliverability).',
    whyItMatters:
      'BIMI can show your logo in supporting inboxes. It does not block core email delivery when missing.',
    howPointsWork:
      'Pass = full points. Warn = partial or not configured (optional category). Fail = not used for BIMI.',
    defaultStepsToPass: [
      'Host a square SVG logo over HTTPS on your domain.',
      'Publish a BIMI TXT record at default._bimi with l= pointing to that SVG.',
      'Obtain a Verified Mark Certificate (VMC) if you need Gmail logo display.',
      'Rescan after DNS and certificate are live.',
    ],
  },
  mx: {
    label: 'Mail routing',
    maxPoints: CATEGORY_WEIGHTS.mx,
    whatItChecks: 'Whether MX records exist and use sensible priorities for primary and backup mail.',
    whyItMatters: 'MX records tell the internet where to deliver email for your domain.',
    howPointsWork: 'Pass = full points. Warn = partial (routing quirks). Fail = no points (no MX).',
    defaultStepsToPass: [
      'Sign in to your DNS provider and open MX records for the domain.',
      'Set your primary mail host to priority 10 (or your provider’s recommended value).',
      'Set any backup host to a higher number (e.g. 20).',
      'Remove duplicate or conflicting MX entries, then rescan.',
    ],
  },
  tls: {
    label: 'SMTP TLS',
    maxPoints: CATEGORY_WEIGHTS.tls,
    whatItChecks:
      'Whether your mail server advertises STARTTLS for encrypted server-to-server delivery.',
    whyItMatters: 'TLS protects messages between mail servers and is expected by major providers.',
    howPointsWork:
      'Pass = full points. Warn = partial (unconfirmed or inconclusive probe). Fail = not used for TLS alone.',
    defaultStepsToPass: [
      'Confirm with your email host that STARTTLS is enabled (most cloud providers enable it by default).',
      'If you run your own mail server, enable STARTTLS on ports 587 and 25.',
      'Ensure a valid TLS certificate is installed on the mail host.',
      'Rescan after changes; some networks block outbound SMTP probes.',
    ],
  },
  https: {
    label: 'HTTPS',
    maxPoints: CATEGORY_WEIGHTS.https,
    whatItChecks:
      'Whether your domain loads over HTTPS and redirects HTTP traffic to HTTPS.',
    whyItMatters:
      'A working HTTPS site supports overall domain trust and is required for some branding checks (e.g. BIMI logos).',
    howPointsWork: 'Pass = full points. Warn = partial (redirect or response issues). Fail = no points (HTTPS down).',
    defaultStepsToPass: [
      'Install a valid SSL certificate on your web host or CDN.',
      'Configure a permanent 301 redirect from http:// to https://.',
      'Verify https://yourdomain loads without certificate errors in a browser.',
      'Rescan after deployment.',
    ],
  },
};

export const STATUS_LABEL_GUIDE: Record<
  StatusLabel,
  { minScore: number; summary: string; meaning: string }
> = {
  Excellent: {
    minScore: 90,
    summary: '90–100',
    meaning:
      'Core authentication (SPF, DKIM, DMARC) is in strong shape. Keep monitoring DNS after any provider change.',
  },
  Good: {
    minScore: 75,
    summary: '75–89',
    meaning:
      'Solid basics with minor gaps. Address warn items below to reach Excellent and reduce spoofing risk.',
  },
  'Needs Attention': {
    minScore: 50,
    summary: '50–74',
    meaning:
      'Important controls are missing or weak. Prioritize DMARC, SPF, and DKIM fixes in the problems section.',
  },
  'High Risk': {
    minScore: 0,
    summary: 'Below 50',
    meaning:
      'Major trust signals are failing. Impersonation and deliverability issues are likely until DNS is corrected.',
  },
};

export function scoreBandForLabel(statusLabel: StatusLabel): string {
  return STATUS_LABEL_GUIDE[statusLabel].meaning;
}

export function getCategoryGuide(category: EmailHealthCategory): CategoryGuideEntry {
  return CATEGORY_GUIDE[category];
}

const SEVERITY_ORDER = { fail: 0, warn: 1, info: 2 } as const;

export function stepsForCategory(
  category: EmailHealthCategory,
  issues: DomainIssue[]
): string[] | undefined {
  const problem = issues
    .filter((i) => i.category === category && (i.severity === 'fail' || i.severity === 'warn'))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const steps = problem[0]?.stepsToPass;
  if (steps && steps.length > 0) return steps;
  return undefined;
}

export function buildStepsByCategory(
  issues: DomainIssue[]
): Partial<Record<EmailHealthCategory, string[]>> {
  const out: Partial<Record<EmailHealthCategory, string[]>> = {};
  for (const key of Object.keys(CATEGORY_GUIDE) as EmailHealthCategory[]) {
    const steps = stepsForCategory(key, issues);
    if (steps) out[key] = steps;
  }
  return out;
}
