import { resolveMxRecords } from '@/lib/email-health/dns';
import { buildCategoryResult } from '@/lib/email-health/scoring';
import type { CategoryResult, DomainIssue } from '@/lib/email-health/types';

export type MailProvider =
  | 'Google Workspace'
  | 'Microsoft 365'
  | 'Zoho Mail'
  | 'Fastmail'
  | 'Proton Mail'
  | 'Custom / other';

function detectProvider(mxHosts: string[]): MailProvider | undefined {
  const joined = mxHosts.join(' ').toLowerCase();
  if (joined.includes('google.com') || joined.includes('googlemail.com')) return 'Google Workspace';
  if (joined.includes('outlook.com') || joined.includes('protection.outlook')) return 'Microsoft 365';
  if (joined.includes('zoho')) return 'Zoho Mail';
  if (joined.includes('fastmail') || joined.includes('messagingengine.com')) return 'Fastmail';
  if (joined.includes('protonmail')) return 'Proton Mail';
  if (mxHosts.length > 0) return 'Custom / other';
  return undefined;
}

export type MxScanResult = {
  category: CategoryResult;
  issues: DomainIssue[];
  mailProvider?: MailProvider;
  primaryMx?: string;
};

export async function scanMx(domain: string): Promise<MxScanResult> {
  const issues: DomainIssue[] = [];
  const mx = await resolveMxRecords(domain);

  if (mx.length === 0) {
    issues.push({
      category: 'mx',
      severity: 'fail',
      title: 'No mail servers (MX) found for this domain',
      explanation: 'Without MX records, this domain cannot receive email at standard addresses.',
      recommendation: 'Add MX records pointing to your email hosting provider.',
      stepsToPass: [
        'Sign in to your email provider and find the MX values they require.',
        'In DNS, add MX records at @ using the provider’s priority and hostname.',
        'Remove any outdated MX records pointing to old hosts.',
        'Wait for DNS propagation, send a test email to the domain, then rescan.',
      ],
      technicalDetail: `No MX records for ${domain}.`,
      dnsRecords: [
        {
          type: 'MX',
          host: '@',
          value: '10 mail.yourprovider.com',
        },
      ],
    });
    return {
      category: buildCategoryResult('mx', 'fail', 'No MX records'),
      issues,
    };
  }

  const sorted = [...mx].sort((a, b) => a.priority - b.priority);
  const hosts = sorted.map((r) => r.exchange.toLowerCase());
  const mailProvider = detectProvider(hosts);
  const primaryMx = sorted[0]?.exchange;

  const priorities = sorted.map((r) => r.priority);
  const uniquePriorities = new Set(priorities);
  let status: 'pass' | 'warn' = 'pass';
  let summary = mailProvider
    ? `Mail hosted on ${mailProvider}`
    : `MX configured (${sorted.length} record${sorted.length === 1 ? '' : 's'})`;

  if (uniquePriorities.size === 1 && sorted.length > 1) {
    status = 'warn';
    issues.push({
      category: 'mx',
      severity: 'warn',
      title: 'All MX records share the same priority',
      explanation: 'Equal priorities can cause uneven delivery or unpredictable failover behavior.',
      recommendation: 'Use distinct priorities (e.g. 10, 20) for primary and backup mail servers.',
      stepsToPass: [
        'Identify which hostname is your primary mail server (from your email provider docs).',
        'Set the primary MX to priority 10 (lower number = higher priority).',
        'Set backup or secondary MX hosts to 20 or higher.',
        'Save DNS and rescan after propagation.',
      ],
      technicalDetail: sorted.map((r) => `${r.priority} ${r.exchange}`).join('; '),
    });
  }

  if (status === 'pass') {
    issues.push({
      category: 'mx',
      severity: 'info',
      title: 'Mail routing looks configured',
      explanation: mailProvider
        ? `We detected ${mailProvider} as your likely email host.`
        : 'MX records are present so the domain can receive email.',
      recommendation: 'Keep MX priorities aligned with your provider documentation.',
      technicalDetail: sorted.map((r) => `${r.priority} ${r.exchange}`).join('; '),
    });
  }

  return {
    category: buildCategoryResult('mx', status, summary),
    issues,
    mailProvider,
    primaryMx,
  };
}
