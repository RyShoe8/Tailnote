import { flattenTxt, resolveTxtRecords } from '@/lib/email-health/dns';
import { buildCategoryResult } from '@/lib/email-health/scoring';
import type { CategoryResult, DomainIssue } from '@/lib/email-health/types';

export type SpfScanResult = {
  category: CategoryResult;
  issues: DomainIssue[];
};

export async function scanSpf(domain: string): Promise<SpfScanResult> {
  const issues: DomainIssue[] = [];
  const txt = flattenTxt(await resolveTxtRecords(domain));
  const spfRecords = txt.filter((r) => r.toLowerCase().startsWith('v=spf1'));

  if (spfRecords.length === 0) {
    issues.push({
      category: 'spf',
      severity: 'fail',
      title: 'Your domain is missing sender authorization (SPF)',
      explanation:
        'Without SPF, receiving mail servers may treat messages from your domain as less trustworthy or reject them.',
      recommendation:
        'Add an SPF TXT record at your domain root that lists the services allowed to send email on your behalf.',
      technicalDetail: `No TXT record starting with v=spf1 found for ${domain}.`,
      dnsRecords: [
        {
          type: 'TXT',
          host: '@',
          value: 'v=spf1 include:_spf.google.com ~all',
        },
      ],
    });
    return {
      category: buildCategoryResult('spf', 'fail', 'No SPF record found'),
      issues,
    };
  }

  if (spfRecords.length > 1) {
    issues.push({
      category: 'spf',
      severity: 'fail',
      title: 'Multiple SPF records detected',
      explanation:
        'Having more than one SPF record breaks authentication — many providers will ignore all of them.',
      recommendation: 'Merge allowed senders into a single SPF TXT record and remove duplicates.',
      technicalDetail: `Found ${spfRecords.length} SPF records: ${spfRecords.join(' | ')}`,
    });
  }

  const spf = spfRecords[0]!;
  const lower = spf.toLowerCase();
  let status: 'pass' | 'warn' | 'fail' = 'pass';
  let summary = 'SPF record is configured';

  if (lower.includes('+all')) {
    status = 'fail';
    summary = 'SPF allows any sender (+all)';
    issues.push({
      category: 'spf',
      severity: 'fail',
      title: 'SPF is too permissive',
      explanation: 'An SPF record with +all tells the world anyone may send as your domain — a common spoofing risk.',
      recommendation: 'Use ~all (softfail) or -all (hardfail) after listing only your real sending services.',
      technicalDetail: spf,
    });
  } else if (lower.includes('?all')) {
    status = 'warn';
    summary = 'SPF uses neutral policy';
    issues.push({
      category: 'spf',
      severity: 'warn',
      title: 'SPF policy is neutral',
      explanation: 'A neutral (?all) policy does little to protect your domain from impersonation.',
      recommendation: 'Switch to ~all or -all once all legitimate senders are listed in the record.',
      technicalDetail: spf,
    });
  } else if (lower.includes('~all')) {
    status = 'warn';
    summary = 'SPF uses softfail';
    issues.push({
      category: 'spf',
      severity: 'info',
      title: 'SPF uses softfail (~all)',
      explanation:
        'Softfail is acceptable for many teams, but stricter -all is stronger once you are confident every sender is listed.',
      recommendation: 'Review includes (Google, Microsoft, CRM, etc.) then consider upgrading to -all.',
      technicalDetail: spf,
    });
  } else if (!lower.includes('-all') && !lower.includes('~all')) {
    status = 'warn';
    summary = 'SPF missing explicit all mechanism';
    issues.push({
      category: 'spf',
      severity: 'warn',
      title: 'SPF may be incomplete',
      explanation: 'The record does not end with a clear ~all or -all policy, which can confuse receivers.',
      recommendation: 'End your SPF record with ~all or -all after all include: mechanisms.',
      technicalDetail: spf,
    });
  }

  if ((spf.match(/include:/gi) ?? []).length > 10) {
    status = status === 'pass' ? 'warn' : status;
    issues.push({
      category: 'spf',
      severity: 'warn',
      title: 'SPF has many nested includes',
      explanation: 'Long include chains can exceed DNS lookup limits and cause SPF to fail unpredictably.',
      recommendation: 'Consolidate sending services or use SPF flattening from your DNS provider.',
      technicalDetail: spf,
    });
  }

  return {
    category: buildCategoryResult('spf', status, summary),
    issues,
  };
}
