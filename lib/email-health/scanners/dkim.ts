import { flattenTxt, resolveTxtRecords } from '@/lib/email-health/dns';
import { buildCategoryResult } from '@/lib/email-health/scoring';
import type { CategoryResult, DomainIssue } from '@/lib/email-health/types';

const COMMON_SELECTORS = [
  'google',
  'selector1',
  'selector2',
  'k1',
  'k2',
  'default',
  's1',
  's2',
  'dkim',
  'mail',
  'smtp',
];

export type DkimScanResult = {
  category: CategoryResult;
  issues: DomainIssue[];
  selectorsFound: string[];
};

export async function scanDkim(domain: string): Promise<DkimScanResult> {
  const issues: DomainIssue[] = [];
  const selectorsFound: string[] = [];
  let weakKey = false;

  for (const selector of COMMON_SELECTORS) {
    const host = `${selector}._domainkey.${domain}`;
    const records = flattenTxt(await resolveTxtRecords(host));
    const dkim = records.find((r) => r.includes('v=DKIM1') || r.includes('p='));
    if (!dkim) continue;
    selectorsFound.push(selector);
    if (dkim.includes('k=rsa') && !dkim.includes('2048') && dkim.length < 400) {
      weakKey = true;
    }
  }

  if (selectorsFound.length === 0) {
    issues.push({
      category: 'dkim',
      severity: 'fail',
      title: 'DKIM signing does not appear to be set up',
      explanation:
        'DKIM adds a cryptographic signature so inbox providers can verify your messages were not tampered with in transit.',
      recommendation:
        'Enable DKIM in your email provider (Google Workspace, Microsoft 365, etc.) and publish the TXT record they provide.',
      technicalDetail: `Checked common selectors (${COMMON_SELECTORS.join(', ')}) — none returned DKIM keys.`,
      dnsRecords: [
        {
          type: 'TXT',
          host: 'selector1._domainkey',
          value: '(paste the DKIM TXT value from your mail provider)',
        },
      ],
    });
    return {
      category: buildCategoryResult('dkim', 'fail', 'No DKIM keys found'),
      issues,
      selectorsFound,
    };
  }

  let status: 'pass' | 'warn' = 'pass';
  let summary = `DKIM found (${selectorsFound.join(', ')})`;

  if (weakKey) {
    status = 'warn';
    summary = 'DKIM present but key may be short';
    issues.push({
      category: 'dkim',
      severity: 'warn',
      title: 'DKIM key may be using older key length',
      explanation: 'Shorter RSA keys are easier to forge; many providers now prefer 2048-bit keys.',
      recommendation: 'Rotate to a 2048-bit DKIM key in your mail provider admin console.',
      technicalDetail: `Selectors: ${selectorsFound.join(', ')}`,
    });
  } else {
    issues.push({
      category: 'dkim',
      severity: 'info',
      title: 'DKIM is configured',
      explanation: 'Messages can be signed so receivers can verify authenticity.',
      recommendation: 'Keep DKIM enabled whenever you add a new sending service.',
      technicalDetail: `Active selectors: ${selectorsFound.join(', ')}`,
    });
  }

  return {
    category: buildCategoryResult('dkim', status, summary),
    issues,
    selectorsFound,
  };
}
